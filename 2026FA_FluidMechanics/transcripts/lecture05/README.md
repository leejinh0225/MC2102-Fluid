# Lecture 5 · Differential Relations for Fluid Flow

[학습 노트](https://leejinh0225.github.io/MC2102-Fluid/lecture05.html) · [TXT](lecture.txt) · [SRT](lecture.srt) · [JSON](lecture.json) · [교정 이력](corrections.json) · [슬라이드 대응표](slide-map.json)

Week 5 강의 한 편(약 85분 20초)과 Chapter 4 PDF 53쪽을 사용합니다. 영상의 실질적인 설명은 PDF 1–26쪽에 대응합니다. 27쪽은 마지막에 미리 표시되지만 설명은 다음 영상으로 넘깁니다. PDF 27–53쪽의 노트는 슬라이드 기반 해설이며, 영상의 구두 설명을 확인한 부분으로 표시하지 않습니다.

## 전사와 검토

faster-whisper `turbo`, 영어 지정, CUDA float16, VAD, `condition_on_previous_text=false`, 단어별 타임스탬프로 자동 전사했습니다. 원시 197개 구간의 텍스트를 모두 읽고 PDF 및 영상의 표본 필기 화면과 대조하여 60개 구간의 전문용어·명확한 오인식을 교정하거나 편집자 주석을 추가했습니다. 모든 구간과 원시 시작·종료 시각을 유지했습니다. 전체 음성을 사람이 축어 청취한 결과는 아닙니다.

수학 기호가 불명확한 발화는 올바른 듯한 인용문으로 재작성하지 않았습니다. `[Review note: ...]`는 편집자의 검산·조건 설명이며 교수자의 발화가 아닙니다. 교정된 구간은 원시 단어별 시각과 텍스트가 달라지므로 `words=null`로 처리합니다. 피스톤 적분 및 점성일 유도의 실제 자기수정 발화는 유지합니다.

캡션과 대응표의 시각은 한 영상의 시작 기준 주제 구간입니다. 정확한 슬라이드 전환 시각을 의미하지 않으며, 다시 설명한 14쪽에는 두 구간이 있습니다. 영상 말미의 수학·AI 관련 일화는 확인된 학술 사실로 채택하지 않습니다.

## 비공개 자료 경계

원본 영상과 원시 전사는 Git에서 제외합니다. 공개 검수본에는 영상 파일 경로·접속 토큰을 넣지 않았습니다. 읽은 전사에서 개인정보 발화는 발견하지 못했습니다.

## 재현

저장소 루트에서 원시 전사가 있는 로컬 환경에 한해 실행합니다.

```powershell
python 2026FA_FluidMechanics/scripts/review_transcript.py private-materials/transcription-staging/lecture05/lecture.json 2026FA_FluidMechanics/transcripts/lecture05/corrections.json 2026FA_FluidMechanics/transcripts/lecture05 --force
```
