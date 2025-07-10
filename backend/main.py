from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import cv2
import mediapipe as mp
import numpy as np
import tempfile
import os
from typing import List, Dict, Any
import math
from pydantic import BaseModel
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="PosturePro API",
    version="1.0.0",
    description="AI-powered posture detection and analysis API"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize MediaPipe
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils
pose = mp_pose.Pose(
    static_image_mode=False,
    model_complexity=1,
    enable_segmentation=False,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

class PostureIssue(BaseModel):
    type: str
    message: str
    severity: str

class AnalysisResult(BaseModel):
    frame_number: int
    timestamp: float
    posture_issues: List[PostureIssue]
    pose_detected: bool

class FrameAnalysisResult(BaseModel):
    pose_detected: bool
    posture_issues: List[PostureIssue]
    confidence_score: float = 0.0

def calculate_angle(point1, point2, point3):
    """Calculate angle between three points"""
    try:
        a = np.array([point1.x, point1.y])
        b = np.array([point2.x, point2.y])
        c = np.array([point3.x, point3.y])
        
        radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
        angle = np.abs(radians * 180.0 / np.pi)
        
        if angle > 180.0:
            angle = 360 - angle
        
        return angle
    except Exception as e:
        logger.error(f"Error calculating angle: {e}")
        return 0.0

def analyze_posture(landmarks) -> List[PostureIssue]:
    """Analyze posture based on MediaPipe landmarks"""
    issues = []
    
    if not landmarks:
        return issues
    
    try:
        # Get key landmarks
        nose = landmarks[mp_pose.PoseLandmark.NOSE.value]
        left_shoulder = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value]
        right_shoulder = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value]
        left_hip = landmarks[mp_pose.PoseLandmark.LEFT_HIP.value]
        right_hip = landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value]
        left_ear = landmarks[mp_pose.PoseLandmark.LEFT_EAR.value]
        right_ear = landmarks[mp_pose.PoseLandmark.RIGHT_EAR.value]
        
        # Calculate midpoints
        shoulder_mid_x = (left_shoulder.x + right_shoulder.x) / 2
        shoulder_mid_y = (left_shoulder.y + right_shoulder.y) / 2
        hip_mid_x = (left_hip.x + right_hip.x) / 2
        hip_mid_y = (left_hip.y + right_hip.y) / 2
        ear_mid_x = (left_ear.x + right_ear.x) / 2
        
        # 1. Forward Head Posture Detection
        head_forward_threshold = 0.05
        if ear_mid_x > shoulder_mid_x + head_forward_threshold:
            issues.append(PostureIssue(
                type="neck_forward",
                message="Forward head posture detected - align your head over your shoulders",
                severity="medium"
            ))
        
        # 2. Slouching Detection (Back Alignment)
        back_alignment_threshold = 0.04
        if abs(shoulder_mid_x - hip_mid_x) > back_alignment_threshold:
            if shoulder_mid_x > hip_mid_x:
                issues.append(PostureIssue(
                    type="back_slouch",
                    message="Slouching detected - straighten your back and engage core",
                    severity="high"
                ))
        
        # 3. Shoulder Level Check
        shoulder_height_diff = abs(left_shoulder.y - right_shoulder.y)
        if shoulder_height_diff > 0.03:
            higher_shoulder = "left" if left_shoulder.y < right_shoulder.y else "right"
            issues.append(PostureIssue(
                type="uneven_shoulders",
                message=f"Uneven shoulders detected - lower your {higher_shoulder} shoulder",
                severity="low"
            ))
        
    except Exception as e:
        logger.error(f"Error in posture analysis: {e}")
        issues.append(PostureIssue(
            type="analysis_error",
            message="Error occurred during posture analysis",
            severity="low"
        ))
    
    return issues

@app.get("/")
async def root():
    return {
        "message": "PosturePro API is running!",
        "version": "1.0.0",
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/analyze")
async def analyze_video(video: UploadFile = File(...)):
    """Analyze posture in uploaded video"""
    if not video.content_type or not video.content_type.startswith('video/'):
        raise HTTPException(status_code=400, detail="File must be a video")
    
    # Check file size (limit to 100MB)
    if video.size and video.size > 100 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Video file too large (max 100MB)")
    
    logger.info(f"Starting video analysis for file: {video.filename}")
    
    # Save uploaded video to temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as tmp_file:
        content = await video.read()
        tmp_file.write(content)
        tmp_file_path = tmp_file.name
    
    try:
        # Open video
        cap = cv2.VideoCapture(tmp_file_path)
        if not cap.isOpened():
            raise HTTPException(status_code=400, detail="Could not open video file")
        
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        if fps <= 0:
            fps = 30  # Default FPS if detection fails
        
        results = []
        frame_number = 0
        processed_frames = 0
        
        # Process every 15th frame to reduce processing time
        frame_skip = 15
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            if frame_number % frame_skip == 0:
                # Convert BGR to RGB
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                
                # Process frame with MediaPipe
                pose_results = pose.process(rgb_frame)
                
                timestamp = frame_number / fps
                pose_detected = pose_results.pose_landmarks is not None
                
                if pose_detected:
                    # Analyze posture
                    posture_issues = analyze_posture(pose_results.pose_landmarks.landmark)
                else:
                    posture_issues = []
                
                results.append(AnalysisResult(
                    frame_number=frame_number,
                    timestamp=timestamp,
                    posture_issues=posture_issues,
                    pose_detected=pose_detected
                ))
                
                processed_frames += 1
                
                # Log progress every 100 processed frames
                if processed_frames % 100 == 0:
                    logger.info(f"Processed {processed_frames} frames")
            
            frame_number += 1
        
        cap.release()
        logger.info(f"Video analysis completed. Processed {processed_frames} frames out of {total_frames}")
        
        return results
        
    except Exception as e:
        logger.error(f"Error processing video: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing video: {str(e)}")
    
    finally:
        # Clean up temporary file
        if os.path.exists(tmp_file_path):
            os.unlink(tmp_file_path)

@app.post("/analyze-frame")
async def analyze_frame(frame: UploadFile = File(...)):
    """Analyze posture in a single frame"""
    if not frame.content_type or not frame.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Read image
        content = await frame.read()
        nparr = np.frombuffer(content, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Could not decode image")
        
        # Convert BGR to RGB
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Process with MediaPipe
        pose_results = pose.process(rgb_image)
        
        pose_detected = pose_results.pose_landmarks is not None
        confidence_score = 0.0
        
        if pose_detected:
            posture_issues = analyze_posture(pose_results.pose_landmarks.landmark)
            # Calculate confidence based on landmark visibility
            visible_landmarks = sum(1 for landmark in pose_results.pose_landmarks.landmark 
                                  if landmark.visibility > 0.5)
            confidence_score = visible_landmarks / len(pose_results.pose_landmarks.landmark)
        else:
            posture_issues = []
        
        return FrameAnalysisResult(
            pose_detected=pose_detected,
            posture_issues=posture_issues,
            confidence_score=confidence_score
        )
        
    except Exception as e:
        logger.error(f"Error processing frame: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing frame: {str(e)}")

@app.get("/health")
async def health_check():
    """Detailed health check endpoint"""
    try:
        # Test MediaPipe initialization
        test_image = np.zeros((100, 100, 3), dtype=np.uint8)
        test_results = pose.process(test_image)
        
        return {
            "status": "healthy",
            "message": "PosturePro API is running",
            "mediapipe_status": "operational",
            "timestamp": datetime.now().isoformat(),
            "version": "1.0.0"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "message": f"Service unavailable: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
        )

@app.get("/stats")
async def get_api_stats():
    """Get API usage statistics"""
    return {
        "endpoints": {
            "analyze": "POST /analyze - Analyze video file",
            "analyze-frame": "POST /analyze-frame - Analyze single frame",
            "health": "GET /health - Health check",
            "stats": "GET /stats - API statistics"
        },
        "supported_formats": {
            "video": ["mp4", "avi", "mov", "webm"],
            "image": ["jpg", "jpeg", "png", "webp"]
        },
        "limits": {
            "max_video_size": "100MB",
            "max_image_size": "10MB"
        }
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
