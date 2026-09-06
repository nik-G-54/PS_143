# PROPOSED / PENDING BACKEND CONTRACT

## Oil Trajectory

Currently, the backend response for `/api/v1/demo/spills/{spill_id}/backtrack` provides the observation point and the source estimate, but lacks the intermediate points that define the oil drift path.

### Backend requirement for oil trajectory:
To enable full 3D oil visualization (Phase 8), the `backtrack` object should include a `trajectory` array.

- **ordered trajectory points** (sorted by time from release to observation)
- **timestamp** (ISO 8601 string)
- **latitude** (number)
- **longitude** (number)

**Example Payload Structure:**
```json
{
  "backtrack": {
    "trajectory": [
      {
        "timestamp": "2019-01-12T12:00:00+00:00",
        "latitude": 35.0300,
        "longitude": 24.0900
      }
    ]
  }
}
```