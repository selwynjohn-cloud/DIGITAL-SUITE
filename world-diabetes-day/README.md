# World Diabetes Day — Elder Guidelines (YouTube)

Ready-to-upload educational video for elders and caregivers.

## Files
- `World_Diabetes_Day_Elder_Guidelines.mp4` — ~3 min narrated video (1920×1080)
- `thumbnail.png` — YouTube thumbnail / title frame
- `YOUTUBE_UPLOAD.txt` — title, description, tags
- `make_video.py` — rebuild script (Pillow + gTTS + ffmpeg)

## Rebuild
```bash
pip install pillow gTTS
python3 world-diabetes-day/make_video.py
# output: /tmp/diabetes-yt/out/World_Diabetes_Day_Elder_Guidelines.mp4
```
