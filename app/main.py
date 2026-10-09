from fastapi import FastAPI, Depends, HTTPException, Header, WebSocket, WebSocketDisconnect, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from app.config import CORS_ORIGINS, DEVICE_API_KEY, ENVIRONMENT
from app.database import Base, engine, get_db
from app.models import Driver, Vehicle, Telemetry, Event, EmergencyAccess
from app import schemas, crud
from app.websocket_manager import manager
import urllib.request
import urllib.error
import urllib.parse
import json

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SOBERDRIVE Safety Monitoring API",
    description="Backend API for SOBERDRIVE Intelligent Alcohol Detection & Vehicle Safety Monitoring System",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
origins = ["*"] if "*" in CORS_ORIGINS else CORS_ORIGINS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    # Initialize demo data on startup
    db = next(get_db())
    try:
        crud.init_demo_data(db)
    finally:
        db.close()

@app.get("/")
def read_root():
    return {
        "status": "SOBERDRIVE BACKEND ONLINE",
        "description": "Intelligent Alcohol Detection & Vehicle Safety Monitoring System",
        "version": "1.0.0",
        "environment": ENVIRONMENT,
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }

# --- ESP32 HARDWARE COMPATIBILITY ENDPOINTS ---
@app.get("/api/connect")
def esp32_connect():
    return {
        "connected": True,
        "vehicle": "SD-CAR-01",
        "message": "DASHBOARD CONNECTED",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/api/status", response_model=schemas.ESP32StatusResponse)
def esp32_status(vehicle_id: str = "SD-CAR-01", db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.vehicle_id == vehicle_id).first()
    latest_telem = db.query(Telemetry).filter(Telemetry.vehicle_id == vehicle_id).order_by(Telemetry.id.desc()).first()

    mq3 = latest_telem.mq3 if latest_telem else 85
    mq2 = latest_telem.mq2 if latest_telem else 120
    mq135 = latest_telem.mq135 if latest_telem else 110
    alcohol = (latest_telem.classification == "ALCOHOL DETECTED") if latest_telem else False
    state = vehicle.state if vehicle else "SAFE"
    emergency = vehicle.emergency_mode if vehicle else False

    return {
        "vehicle": vehicle_id,
        "driver": vehicle.driver_id if vehicle else "SD1024",
        "mq3": mq3,
        "mq2": mq2,
        "mq135": mq135,
        "alcohol": alcohol,
        "state": state,
        "emergency": emergency,
        "wifi_rssi": -48
    }

@app.post("/api/emergency")
async def esp32_emergency_toggle(
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    enable = payload.get("enable", True)
    vehicle_id = payload.get("vehicle", "SD-CAR-01")
    driver_id = payload.get("driver", "SD1024")

    if enable:
        req = schemas.EmergencyActivateRequest(vehicle_id=vehicle_id, driver_id=driver_id, duration_hours=6.0)
        record = crud.activate_emergency_mode(db, req)
        await manager.broadcast({
            "type": "EMERGENCY_ACTIVATED",
            "data": { "vehicle_id": vehicle_id, "driver_id": driver_id, "seconds_remaining": 21600 }
        })
        return {"success": True, "message": "Emergency access granted by ESP32 safety controller", "enable": True}
    else:
        crud.expire_emergency_mode(db, vehicle_id)
        await manager.broadcast({
            "type": "EMERGENCY_EXPIRED",
            "data": { "vehicle_id": vehicle_id }
        })
        return {"success": True, "message": "Emergency mode expired/disabled", "enable": False}

# --- ESP32 BACKEND PROXY FALLBACK ---
@app.get("/api/proxy")
def esp32_proxy_get(target: str = Query(...)):
    try:
        req = urllib.request.Request(target, headers={'User-Agent': 'ALCOALTO-Backend-Proxy'})
        with urllib.request.urlopen(req, timeout=4) as response:
            data = response.read().decode('utf-8')
            return json.loads(data)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Proxy failed to reach ESP32 at {target}: {str(e)}")

@app.post("/api/proxy/emergency")
def esp32_proxy_post_emergency(target: str = Query(...), enable: bool = Query(True)):
    try:
        body_data = urllib.parse.urlencode({"enable": "true" if enable else "false"}).encode('utf-8')
        req = urllib.request.Request(target, data=body_data, headers={'Content-Type': 'application/x-www-form-urlencoded'}, method='POST')
        with urllib.request.urlopen(req, timeout=4) as response:
            res_data = response.read().decode('utf-8')
            return json.loads(res_data)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Proxy emergency error: {str(e)}")

# --- VEHICLE & DRIVER API ---
@app.get("/api/vehicles", response_model=List[schemas.VehicleResponse])
def list_vehicles(db: Session = Depends(get_db)):
    return db.query(Vehicle).all()

@app.get("/api/vehicles/{vehicle_id}", response_model=schemas.VehicleResponse)
def get_vehicle(vehicle_id: str, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.vehicle_id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle

@app.get("/api/drivers/{driver_id}", response_model=schemas.DriverResponse)
def get_driver(driver_id: str, db: Session = Depends(get_db)):
    driver = db.query(Driver).filter(Driver.driver_id == driver_id).first()
    if not driver:
        driver = db.query(Driver).filter(Driver.driver_id == "SD1024").first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    return driver

# --- TELEMETRY API ---
@app.get("/api/telemetry/{vehicle_id}")
def get_telemetry_history(vehicle_id: str, limit: int = Query(default=50, le=200), db: Session = Depends(get_db)):
    telemetry_records = db.query(Telemetry)\
        .filter(Telemetry.vehicle_id == vehicle_id)\
        .order_by(Telemetry.id.desc())\
        .limit(limit).all()
    
    telemetry_records.reverse()
    latest = telemetry_records[-1] if telemetry_records else None

    vehicle = db.query(Vehicle).filter(Vehicle.vehicle_id == vehicle_id).first()
    seconds_remaining = 0
    emergency_mode = False
    if vehicle and vehicle.emergency_mode and vehicle.emergency_expires_at:
        now = datetime.utcnow()
        if now < vehicle.emergency_expires_at:
            seconds_remaining = int((vehicle.emergency_expires_at - now).total_seconds())
            emergency_mode = True

    return {
        "vehicle_id": vehicle_id,
        "latest": latest,
        "history": telemetry_records,
        "emergency_mode": emergency_mode,
        "emergency_remaining": seconds_remaining,
        "vehicle_state": vehicle.state if vehicle else "SAFE"
    }

@app.post("/api/telemetry", response_model=schemas.TelemetryResponse)
async def post_telemetry(
    payload: schemas.TelemetryPayload,
    x_device_api_key: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    if x_device_api_key and x_device_api_key != DEVICE_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid Device API Key")

    telemetry = crud.save_telemetry(db, payload)

    telemetry_dict = {
        "id": telemetry.id,
        "vehicle_id": telemetry.vehicle_id,
        "vehicle": telemetry.vehicle_id,
        "driver_id": telemetry.driver_id,
        "driver": telemetry.driver_id,
        "mq3": telemetry.mq3,
        "mq2": telemetry.mq2,
        "mq135": telemetry.mq135,
        "alcohol": (telemetry.classification == "ALCOHOL DETECTED"),
        "state": telemetry.vehicle_state,
        "emergency": telemetry.emergency_mode,
        "wifi_rssi": -48,
        "classification": telemetry.classification,
        "vehicle_state": telemetry.vehicle_state,
        "emergency_mode": telemetry.emergency_mode,
        "emergency_remaining": telemetry.emergency_remaining,
        "latitude": telemetry.latitude,
        "longitude": telemetry.longitude,
        "location_source": telemetry.location_source,
        "timestamp": telemetry.timestamp.isoformat() if telemetry.timestamp else datetime.utcnow().isoformat()
    }
    await manager.broadcast({"type": "TELEMETRY_UPDATE", "data": telemetry_dict})

    return telemetry

# --- EVENTS API ---
@app.post("/api/events", response_model=schemas.EventResponse)
async def post_event(event_data: schemas.EventCreate, db: Session = Depends(get_db)):
    event = crud.create_event(db, event_data)
    
    event_dict = {
        "id": event.id,
        "event_type": event.event_type,
        "timestamp": event.timestamp.isoformat(),
        "vehicle_id": event.vehicle_id,
        "driver_id": event.driver_id,
        "latitude": event.latitude,
        "longitude": event.longitude,
        "classification": event.classification,
        "vehicle_state": event.vehicle_state,
        "details": event.details
    }
    await manager.broadcast({"type": "NEW_EVENT", "data": event_dict})
    return event

@app.get("/api/events", response_model=List[schemas.EventResponse])
def get_events(limit: int = Query(default=100, le=500), db: Session = Depends(get_db)):
    return db.query(Event).order_by(Event.id.desc()).limit(limit).all()

# --- EMERGENCY ACCESS API ---
@app.post("/api/emergency/activate")
async def activate_emergency(req: schemas.EmergencyActivateRequest, db: Session = Depends(get_db)):
    record = crud.activate_emergency_mode(db, req)
    now = datetime.utcnow()
    seconds_remaining = int((record.expiry_time - now).total_seconds())

    await manager.broadcast({
        "type": "EMERGENCY_ACTIVATED",
        "data": {
            "vehicle_id": req.vehicle_id,
            "driver_id": req.driver_id,
            "seconds_remaining": seconds_remaining,
            "expiry_time": record.expiry_time.isoformat()
        }
    })

    return {
        "status": "EMERGENCY ACCESS ACTIVATED",
        "vehicle_id": req.vehicle_id,
        "driver_id": req.driver_id,
        "activation_time": record.activation_time.isoformat(),
        "expiry_time": record.expiry_time.isoformat(),
        "seconds_remaining": seconds_remaining
    }

@app.get("/api/emergency/{vehicle_id}", response_model=schemas.EmergencyStatusResponse)
def get_emergency_status(vehicle_id: str, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.vehicle_id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    now = datetime.utcnow()
    seconds_remaining = 0
    is_active = False

    if vehicle.emergency_mode and vehicle.emergency_expires_at:
        if now < vehicle.emergency_expires_at:
            is_active = True
            seconds_remaining = int((vehicle.emergency_expires_at - now).total_seconds())
        else:
            crud.expire_emergency_mode(db, vehicle_id)

    last_record = db.query(EmergencyAccess).filter(
        EmergencyAccess.vehicle_id == vehicle_id
    ).order_by(EmergencyAccess.id.desc()).first()

    return {
        "is_active": is_active,
        "vehicle_id": vehicle_id,
        "driver_id": vehicle.driver_id,
        "activation_time": last_record.activation_time if last_record else None,
        "expiry_time": vehicle.emergency_expires_at if is_active else None,
        "seconds_remaining": max(0, seconds_remaining),
        "vehicle_state": vehicle.state
    }

@app.post("/api/emergency/{vehicle_id}/expire")
async def expire_emergency(vehicle_id: str, db: Session = Depends(get_db)):
    vehicle = crud.expire_emergency_mode(db, vehicle_id)
    await manager.broadcast({
        "type": "EMERGENCY_EXPIRED",
        "data": { "vehicle_id": vehicle_id, "vehicle_state": vehicle.state }
    })
    return {"status": "EMERGENCY ACCESS EXPIRED", "vehicle_id": vehicle_id, "vehicle_state": vehicle.state}

# --- WEBSOCKET ENDPOINT ---
@app.websocket("/ws/telemetry")
@app.websocket("/ws/telemetry/{vehicle_id}")
async def websocket_endpoint(websocket: WebSocket, vehicle_id: Optional[str] = None):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        manager.disconnect(websocket)
