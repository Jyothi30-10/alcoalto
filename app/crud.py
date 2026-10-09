from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.models import Driver, Vehicle, Telemetry, Event, EmergencyAccess
from app.schemas import TelemetryPayload, EventCreate, EmergencyActivateRequest
import logging

logger = logging.getLogger("alcoalto.crud")

def init_demo_data(db: Session):
    """Seed initial demo driver and vehicle for ALCOALTO"""
    driver = db.query(Driver).filter(Driver.driver_id == "AA1024").first()
    if not driver:
        driver = Driver(
            driver_id="AA1024",
            name="Demo Driver",
            license_plate="TN01AB1234",
            license_status="VALID",
            phone="Registered Number",
            vehicle_id="AA-CAR-01"
        )
        db.add(driver)
        db.commit()

    vehicle = db.query(Vehicle).filter(Vehicle.vehicle_id == "AA-CAR-01").first()
    if not vehicle:
        vehicle = Vehicle(
            vehicle_id="AA-CAR-01",
            model="ALCOALTO TEST VEHICLE",
            license_plate="TN01AB1234",
            driver_id="AA1024",
            state="SAFE",
            emergency_mode=False
        )
        db.add(vehicle)
        db.commit()

    telemetry_count = db.query(Telemetry).filter(Telemetry.vehicle_id == "AA-CAR-01").count()
    if telemetry_count == 0:
        init_telemetry = Telemetry(
            vehicle_id="AA-CAR-01",
            driver_id="AA1024",
            mq3=85,
            mq2=120,
            mq135=110,
            classification="SAFE",
            vehicle_state="SAFE",
            emergency_mode=False,
            emergency_remaining=0,
            latitude=13.021800,
            longitude=80.174300,
            location_source="GPS",
            timestamp=datetime.utcnow()
        )
        db.add(init_telemetry)
        db.commit()

def save_telemetry(db: Session, payload: TelemetryPayload) -> Telemetry:
    vehicle_id = payload.vehicle_id or payload.vehicle or "AA-CAR-01"
    driver_id = payload.driver_id or payload.driver or "AA1024"

    vehicle = db.query(Vehicle).filter(Vehicle.vehicle_id == vehicle_id).first()
    if not vehicle:
        vehicle = Vehicle(
            vehicle_id=vehicle_id,
            model="ALCOALTO TEST VEHICLE",
            license_plate="TN01AB1234",
            driver_id=driver_id,
            state=payload.vehicle_state or payload.state or "SAFE"
        )
        db.add(vehicle)
        db.commit()
        db.refresh(vehicle)

    now = datetime.utcnow()
    seconds_remaining = 0
    emergency_active = False

    if vehicle.emergency_mode and vehicle.emergency_expires_at:
        if now < vehicle.emergency_expires_at:
            emergency_active = True
            seconds_remaining = int((vehicle.emergency_expires_at - now).total_seconds())
        else:
            vehicle.emergency_mode = False
            vehicle.state = "LOCKED"
            expire_event = Event(
                event_type="EMERGENCY ACCESS EXPIRED",
                timestamp=now,
                vehicle_id=vehicle_id,
                driver_id=driver_id,
                latitude=payload.latitude,
                longitude=payload.longitude,
                mq3=payload.mq3,
                mq2=payload.mq2,
                mq135=payload.mq135,
                classification=payload.classification,
                vehicle_state="LOCKED",
                details="6-hour emergency access period expired. Vehicle authorization ended."
            )
            db.add(expire_event)

    if emergency_active:
        vehicle_state = "EMERGENCY MODE"
    else:
        vehicle_state = payload.vehicle_state or payload.state or "SAFE"

    vehicle.state = vehicle_state
    vehicle.last_updated = now
    db.commit()

    telemetry = Telemetry(
        vehicle_id=vehicle_id,
        driver_id=driver_id,
        mq3=payload.mq3,
        mq2=payload.mq2,
        mq135=payload.mq135,
        classification=payload.classification or ("ALCOHOL DETECTED" if payload.alcohol else "SAFE"),
        vehicle_state=vehicle_state,
        emergency_mode=emergency_active,
        emergency_remaining=seconds_remaining,
        latitude=payload.latitude or 13.021800,
        longitude=payload.longitude or 80.174300,
        location_source=payload.location_source or "GPS",
        timestamp=now
    )
    db.add(telemetry)
    db.commit()
    db.refresh(telemetry)

    return telemetry

def create_event(db: Session, event_data: EventCreate) -> Event:
    event = Event(
        event_type=event_data.event_type,
        timestamp=datetime.utcnow(),
        vehicle_id=event_data.vehicle_id,
        driver_id=event_data.driver_id,
        latitude=event_data.latitude,
        longitude=event_data.longitude,
        mq3=event_data.mq3,
        mq2=event_data.mq2,
        mq135=event_data.mq135,
        classification=event_data.classification,
        vehicle_state=event_data.vehicle_state,
        details=event_data.details
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

def activate_emergency_mode(db: Session, req: EmergencyActivateRequest) -> EmergencyAccess:
    now = datetime.utcnow()
    expiry = now + timedelta(hours=req.duration_hours)

    vehicle = db.query(Vehicle).filter(Vehicle.vehicle_id == req.vehicle_id).first()
    if vehicle:
        vehicle.emergency_mode = True
        vehicle.emergency_expires_at = expiry
        vehicle.state = "EMERGENCY MODE"
        vehicle.last_updated = now

    record = EmergencyAccess(
        vehicle_id=req.vehicle_id,
        driver_id=req.driver_id,
        activation_time=now,
        expiry_time=expiry,
        is_active=True,
        reason=req.reason or "DRIVER EMERGENCY REQUEST"
    )
    db.add(record)

    event = Event(
        event_type="EMERGENCY ACCESS ACTIVATED",
        timestamp=now,
        vehicle_id=req.vehicle_id,
        driver_id=req.driver_id,
        vehicle_state="EMERGENCY MODE",
        details=f"6-Hour Emergency Access activated. Expiry at {expiry.isoformat()}"
    )
    db.add(event)

    db.commit()
    db.refresh(record)
    return record

def expire_emergency_mode(db: Session, vehicle_id: str) -> Vehicle:
    now = datetime.utcnow()
    vehicle = db.query(Vehicle).filter(Vehicle.vehicle_id == vehicle_id).first()
    if vehicle:
        vehicle.emergency_mode = False
        vehicle.emergency_expires_at = now
        vehicle.state = "LOCKED"
        vehicle.last_updated = now

        access_records = db.query(EmergencyAccess).filter(
            EmergencyAccess.vehicle_id == vehicle_id,
            EmergencyAccess.is_active == True
        ).all()
        for rec in access_records:
            rec.is_active = False

        event = Event(
            event_type="EMERGENCY ACCESS EXPIRED",
            timestamp=now,
            vehicle_id=vehicle_id,
            driver_id=vehicle.driver_id,
            vehicle_state="LOCKED",
            details="Emergency access terminated by authority or timer expiry."
        )
        db.add(event)
        db.commit()
        db.refresh(vehicle)
    return vehicle
