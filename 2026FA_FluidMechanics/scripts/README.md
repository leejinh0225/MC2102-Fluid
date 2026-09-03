# 전처리·검증 도구

## `remove_trailing_pdf_masks.py`

PowerPoint에서 PDF 끝부분에 덧씌운 흰색 답 가림막만 제거합니다. 원본 파일을 덮어쓰지 않으며, 텍스트나 이미지가 섞인 꼬리 블록은 안전을 위해 거부합니다.

```powershell
python .\remove_trailing_pdf_masks.py source.pdf cleaned.pdf
```

필요 패키지: `pypdf`

## `render_pdf_slides.ps1`

정리용 PDF를 웹 노트용 `1440 × 1080` JPG로 변환하고 파일명을 `slide-01.jpg` 형식으로 정규화합니다. 기존 이미지가 있으면 기본적으로 중단합니다.

```powershell
.\render_pdf_slides.ps1 -InputPdf ..\lecture_notes\lecture01_note.pdf `
  -OutputDirectory ..\site\assets\slides\lecture01
```

필요 도구: Poppler의 `pdftoppm`

## `transcribe_english.py`

비공개 영상 또는 음성 파일을 직접 읽어 영어 STT를 수행합니다. 기본 엔진은 `faster-whisper 1.2.1`, 모델은 `turbo`, 언어는 영어로 고정하며 Silero VAD로 긴 무음 구간을 줄입니다.

결과는 타임스탬프가 있는 `lecture.txt`, 자막 `lecture.srt`, 검수용 메타데이터 `lecture.json`입니다. 원시 결과에는 수업 외 대화가 섞일 수 있으므로 먼저 비공개 staging 폴더에 출력합니다.

```powershell
python -m venv ..\..\.venv-stt
..\..\.venv-stt\Scripts\python.exe -m pip install -r .\requirements-stt.txt

..\..\.venv-stt\Scripts\python.exe .\transcribe_english.py `
  "<lecture01 video>" `
  --output-dir "..\..\private-materials\transcription-staging\lecture01"
```

- GPU 사용: `requirements-stt-gpu.txt`를 설치한 뒤 `--device cuda --compute-type float16`
- CPU 사용: `--device cpu --compute-type int8`
- 첫 실행은 모델을 내려받으며, 기본 캐시는 Git에서 제외되는 `private-materials/models/faster-whisper/`입니다.
- 시스템 FFmpeg는 필요하지 않습니다. `faster-whisper`가 PyAV로 영상을 직접 디코딩합니다.

Windows에서 `cublas64_12.dll` 또는 `cudnn64_9.dll` 오류가 나면 NVIDIA 공식 pip 런타임을 포함한 GPU 요구사항을 설치합니다. 스크립트는 가상환경 안의 DLL 디렉터리를 자동으로 등록합니다.

```powershell
..\..\.venv-stt\Scripts\python.exe -m pip install -r .\requirements-stt-gpu.txt
```

## `review_transcript.py`

비공개 원시 JSON과 사람이 작성한 교정 manifest를 결합해 공개 가능한 `TXT/SRT/JSON`을 만듭니다. 교정된 구간은 더 이상 단어별 시간이 정확히 대응하지 않으므로 해당 구간의 원시 word timestamp를 제거하고, 원본 구간 번호를 `source_index`로 보존합니다.

```powershell
python .\review_transcript.py raw.json corrections.json ..\transcripts\lecture01 --force
```

## `extract_audio.ps1`

별도 WAV나 M4A가 필요할 때 비공개 녹화의 첫 번째 오디오 트랙을 추출하는 선택 도구입니다. STT의 필수 단계는 아닙니다.

- `Transcription` 기본값: mono 16 kHz PCM WAV
- `Archive`: mono AAC 96 kbps M4A
- 출력 파일이 이미 있으면 `-Force` 없이는 덮어쓰지 않음

```powershell
.\extract_audio.ps1 -InputVideo "<lecture01 video>"
.\extract_audio.ps1 -InputVideo "<lecture01 video>" -Mode Archive
```

필요 도구: FFmpeg. PATH에 없으면 `-FfmpegPath "<path to ffmpeg.exe>"`를 지정합니다.

## 검증기

- `validate_site.mjs`: 공개 인덱스, 두 PDF 다운로드 링크·파일명·강조, 준비 상태, 슬라이드 수, 깨진 링크, 비공개 미디어 참조를 검사
- `validate_lecture_site.py`: 완성된 렉처 HTML의 페이지 수, 이미지 순서·해상도, 목차와 개인정보 경계를 검사
