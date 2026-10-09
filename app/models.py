from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from datetime import datetime, timezone
from app.database import Base

class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(String, unique=True, index=True)
    name = Column(String, nullable=False)
    license_plate = Column(String, nullable=False)
    license_status = Column(String, default="ACTIVE / VALID")
    phone = Column(String, default="+91 98765 43210")
    vehicle_id = Column(String, nullable=False)

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(String, unique=True, index=True)
    model = Column(String, default="SOBERDRIVE TEST VEHICLE")
    license_plate = Column(String, nullable=False)
    driver_id = Column(String, nullable=False)
    state = Column(String, default="SAFE")
    emergency_mode = Column(Boolean, default=False)
    emergency_expires_at = Column(DateTime, nullable=True)
    last_updated = Column(DateTime, default=datetime.utcnow)

class Telemetry(Base):
    __tablename__ = "telemetry"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(String, index=True, nullable=False)
    driver_id = Column(String, nullable=False)
    mq3 = Column(Integer, default=0)
    mq2 = Column(Integer, default=0)
    mq135 = Column(Integer, default=0)
    classification = Column(String, default="SAFE")  # SAFE, ALCOHOL DETECTED, UNKNOWN
    vehicle_state = Column(String, default="SAFE")
    emergency_mode = Column(Boolean, default=False)
    emergency_remaining = Column(Integer, default=0)
    latitude = Column(Float, default=13.021800)
    longitude = Column(Float, default=80.174300)
    location_source = Column(String, default="GPS")  # GPS vs NETWORK LOCATION — APPROXIMATE
    timestamp = Column(DateTime, default=datetime.utcnow)

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String, nullable=False)  # BREATH TEST STARTED, ALCOHOL DETECTED, EMERGENCY ACCESS ACTIVATED, etc.
    timestamp = Column(DateTime, default=datetime.utcnow)
    vehicle_id = Column(String, nullable=False)
    driver_id = Column(String, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    mq3 = Column(Integer, nullable=True)
    mq2 = Column(Integer, nullable=True)
    mq135 = Column(Integer, nullable=True)
    classification = Column(String, nullable=True)
    vehicle_state = Column(String, nullable=True)
    details = Column(String, nullable=True)

class EmergencyAccess(Base):
    __tablename__ = "emergency_access"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(String, nullable=False)
    driver_id = Column(String, nullable=False)
    activation_time = Column(DateTime, default=datetime.utcnow)
    expiry_time = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True)
    reason = Column(String, default="DRIVER EMERGENCY REQUEST")
