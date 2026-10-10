import cv2
import torch
from ultralytics import YOLO

# Load the trained YOLO model
model = YOLO("F:/yolo_drowsiness/yolo_training/weights/epoch40.pt")
# Open webcam (0 for default camera, change if using external camera)
cap = cv2.VideoCapture(0)

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    # Run YOLO inference
    results = model(frame)

    # Plot the results on the frame
    annotated_frame = results[0].plot()

    # Display the output
    cv2.imshow("Drowsiness Detection", annotated_frame)

    # Press 'q' to exit
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Release resources
cap.release()
cv2.destroyAllWindows()
