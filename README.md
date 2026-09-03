# 2026FA Fluid Mechanics 1 학습 저장소

영문 강의자료와 한 편의 비공개 OBS 녹화를 대조하여 한국어 수업 대체 노트를 만드는 저장소입니다. 동역학 노트의 스크롤형 구성과 crimson 디자인을 이어받되, 유체역학 강의의 실제 입력 구조에 맞추었습니다.

## 동역학 저장소와 다른 점

- 렉처마다 여러 YouTube 영상이 아니라 **비공개 강의 녹화 1개**를 사용합니다.
- 녹화 원본과 추출 음성은 `private-materials/`에만 두며 Git과 공개 사이트에 올리지 않습니다.
- 공개 HTML에는 영상 재생 버튼이나 로컬 녹화 경로를 넣지 않습니다.
- Git에는 가림막을 제거한 PDF, 공개용 원본 PDF 사본, 검수한 영어 스크립트, 슬라이드 이미지, 한국어 HTML 노트를 보관합니다.
- 현재 PDF는 4:3이므로 슬라이드 이미지를 `1440 × 1080`으로 렌더링합니다. 동역학의 16:9 틀에 억지로 늘이지 않습니다.

## 저장 경계

| 구분 | 위치 | Git 포함 여부 |
|---|---|---|
| 가림막 제거 강의 PDF | `2026FA_FluidMechanics/lecture_notes/` | 포함 |
| 원본 강의 PDF 공개 사본 | `2026FA_FluidMechanics/lecture_notes/` | 포함 |
| 검수한 영어 스크립트 | `2026FA_FluidMechanics/transcripts/` | 포함 |
| 한국어 HTML과 슬라이드 이미지 | `2026FA_FluidMechanics/site/` | 포함 |
| 전처리·검증 스크립트 | `2026FA_FluidMechanics/scripts/` | 포함 |
| OBS 녹화, 추출 음성, 변경 금지 원본 PDF 백업, 선배 자료 | `private-materials/` | **제외** |

`private-materials/`와 흔한 영상·음성 확장자는 저장소 루트의 `.gitignore`에서 이중으로 차단합니다. 이 경로에 `git add -f`를 사용하지 않습니다.

## 현재 준비 상태

- Lecture 01 `Chapter 1 — Introduction to Fluid Mechanics`
  - 가림막 제거 PDF: 준비 완료, 23쪽
  - 원본 PDF 공개 사본: 준비 완료, 23쪽
  - 4:3 슬라이드 이미지: 준비 완료, 23장
  - 비공개 영어 강의 녹화: 보관·해시 검증 완료, Git 제외
  - 영어 스크립트: `faster-whisper turbo` 전사 및 23쪽 PDF 대조 검수 완료
  - 한국어 HTML: 원본 23쪽, 핵심 요약, 시험 영어, 용어집, 교정 기록 작성 완료
- 선배 제공 자료: 원본은 그대로 두고 `private-materials/senior-archive/`에 복사 보관
- GitHub 공개 대상: `leejinh0225/MC2102-Fluid`의 `main`과 GitHub Pages

## 한 강의 처리 순서

1. 원본 PDF를 `private-materials/source-pdfs/<lecture>/`에 보관합니다.
2. 답 가림막이 PDF 마지막 그래픽 블록으로 덧씌워진 형식이면 `remove_trailing_pdf_masks.py`로 새 PDF를 만듭니다.
3. 가림막 제거본과 공개용 원본 사본을 `lecture_notes/`에 두고, 제거본으로 `render_pdf_slides.ps1`을 실행해 4:3 JPG를 만듭니다. 변경 금지 백업은 비공개 위치에 계속 보존합니다.
4. 두 PDF의 직접 다운로드 링크를 `site/downloads.html`, 강의 목록 카드, 완성된 렉처 페이지에 연결합니다.
5. OBS 녹화는 `private-materials/recordings/<lecture>/`에 둡니다.
6. `transcribe_english.py`가 녹화 파일을 직접 읽고 `faster-whisper`의 `turbo` 모델로 영어 STT를 수행합니다.
7. 원시 `TXT/SRT/JSON`은 먼저 `private-materials/transcription-staging/`에 만들고, PDF와 대조해 전문용어·개인정보를 검수합니다.
8. 검수가 끝난 `lecture.txt`, `lecture.srt`, `lecture.json`만 `transcripts/<lecture>/`에 보관합니다.
9. `site/templates/lecture-page.template.html`과 프로젝트 로컬 skill을 사용하여 스크롤형 한국어 노트를 작성합니다.
10. 검증기를 통과시킨 뒤에만 강의 목록에서 HTML 링크를 활성화합니다.

### 영어 STT 예시

```powershell
python -m venv .venv-stt
.\.venv-stt\Scripts\python.exe -m pip install -r `
  .\2026FA_FluidMechanics\scripts\requirements-stt-gpu.txt

.\.venv-stt\Scripts\python.exe `
  .\2026FA_FluidMechanics\scripts\transcribe_english.py `
  ".\private-materials\recordings\lecture01\lecture01.mkv" `
  --output-dir ".\private-materials\transcription-staging\lecture01"
```

첫 실행에는 모델 다운로드가 필요하지만 음성 파일은 외부 STT API로 전송하지 않습니다. 모델도 Git에서 제외되는 `private-materials/models/`에 저장됩니다. `extract_audio.ps1`는 별도 음성 파일이 필요할 때만 쓰는 선택 도구입니다.

## 주요 문서

- [강의 인덱스](./2026FA_FluidMechanics/강의_인덱스.md)
- [노트 집필 규격](./2026FA_FluidMechanics/NOTE_AUTHORING_GUIDE.md)
- [Lecture 01 스크립트 입력 규격](./2026FA_FluidMechanics/transcripts/lecture01/README.md)
- [공개 사이트 초안](./2026FA_FluidMechanics/site/index.html)
- [강의자료 PDF 다운로드 페이지](./2026FA_FluidMechanics/site/downloads.html)
