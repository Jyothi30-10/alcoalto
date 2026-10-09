from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ESP32StatusResponse(BaseModel):
    vehicle: str = "SD-CAR-01"
    driver: str = "SD1024"
    mq3: int = 85
    mq2: int = 120
    mq135: int = 110
    alcohol: bool = False
    state: str = "SAFE"
    emergency: bool = False
    wifi_rssi: int = -48

class TelemetryPayload(BaseModel):
    device_id: Optional[str] = "SD-CAR-01"
    driver_id: Optional[str] = "SD1024"
    vehicle_id: Optional[str] = "SD-CAR-01"
    vehicle: Optional[str] = "SD-CAR-01"
    driver: Optional[str] = "SD1024"
    mq3: int = Field(default=85, description="MQ-3 alcohol sensor raw reading")
    mq2: int = Field(default=120, description="MQ-2 VOC/gas sensor raw reading")
    mq135: int = Field(default=110, description="MQ-135 air quality sensor raw reading")
    alcohol: Optional[bool] = False
    state: Optional[str] = "SAFE"
    emergency: Optional[bool] = False
    wifi_rssi: Optional[int] = -48
    classification: Optional[str] = "SAFE"
    vehicle_state: Optional[str] = "SAFE"
    emergency_mode: bool = False
    emergency_remaining: int = 0
    latitude: float = 13.021800
    longitude: float = 80.174300
    location_source: str = "GPS"  # "GPS" or "NETWORK APPROXIMATION"
    timestamp: Optional[datetime] = None

class TelemetryResponse(TelemetryPayload):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True

class DriverResponse(BaseModel):
    id: int
    driver_id: str
    name: str
    license_plate: str
    license_status: str
    phone: str
    vehicle_id: str

    class Config:
        from_attributes = True

class VehicleResponse(BaseModel):
    id: int
    vehicle_id: str
    model: str
    license_plate: str
    driver_id: str
    state: str
    emergency_mode: bool
    emergency_expires_at: Optional[datetime] = None
    last_updated: datetime

    class Config:
        from_attributes = True

class EventCreate(BaseModel):
    event_type: str
    vehicle_id: str
    driver_id: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    mq3: Optional[int] = None
    mq2: Optional[int] = None
    mq135: Optional[int] = None
    classification: Optional[str] = None
    vehicle_state: Optional[str] = None
    details: Optional[str] = None

class EventResponse(EventCreate):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True

class EmergencyActivateRequest(BaseModel):
    vehicle_id: str = "SD-CAR-01"
    driver_id: str = "SD1024"
    duration_hours: float = 6.0
    reason: Optional[str] = "EMERGENCY ACCESS REQUESTED BY DRIVER"
    enable: Optional[bool] = True

class EmergencyStatusResponse(BaseModel):
    is_active: bool
    vehicle_id: str
    driver_id: str
    activation_time: Optional[datetime] = None
    expiry_time: Optional[datetime] = None
    seconds_remaining: int
    vehicle_state: str
