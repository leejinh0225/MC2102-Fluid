# Lecture 5 · Differential Relations for Fluid Flow

[학습 노트](https://leejinh0225.github.io/MC2102-Fluid/lecture05.html) · [슬라이드 대응표](slide-map.json)

Chapter 4 PDF 53쪽과 영어 강의 두 편을 사용합니다. Part 1은 Week 5, Part 2는 Week 6 Ch04 Part 2이며 같은 Lecture 5 노트로 제공합니다. 각 타임스탬프는 해당 영상의 시작 기준입니다.

| 영상 | 길이 | 대응 PDF | 스크립트 |
|---|---|---|---|
| Part 1 · Week 5 | 85분 20초 | 1–26쪽 | [TXT](lecture.txt) · [SRT](lecture.srt) · [JSON](lecture.json) · [교정 이력](corrections.json) |
| Part 2 · Week 6 | 77분 52초 | 27–52쪽 | [TXT](part02/lecture.txt) · [SRT](part02/lecture.srt) · [JSON](part02/lecture.json) · [교정 이력](part02/corrections.json) |

Part 1 끝에 27쪽이 미리 표시되지만 실제 설명은 Part 2에서 시작합니다. Part 2는 52쪽의 유선·등퍼텐셜선을 비교한 뒤 Chapter 4를 마칩니다. **53쪽은 슬라이드 기반 종합 정리**이며 별도의 영상 설명으로 표시하지 않습니다. Part 1의 기존 파일과 URL은 유지하고 Part 2를 `part02/`에 추가합니다.

## 전사와 검토

두 편 모두 로컬 faster-whisper `turbo`, 영어 지정, CUDA float16, VAD, `condition_on_previous_text=false`, 단어별 타임스탬프로 전사했습니다.

- Part 1: 원시 197개 구간을 모두 읽고 60개 구간에 전문용어 교정 또는 편집자 주석을 반영했습니다. 기존 검수본은 변경하지 않았습니다.
- Part 2: 원시 201개 구간을 모두 읽고 PDF 및 표본 필기 화면과 대조하여 94개 구간에 전문용어 교정 또는 편집자 주석을 반영했습니다. 생략한 구간은 없습니다.

이는 모델 보조 전사 검토이며 전체 음성을 사람이 축어 청취한 결과는 아닙니다.

수학 기호가 불명확한 발화는 올바른 듯한 인용문으로 재작성하지 않았습니다. `[Review note: ...]`는 편집자의 검산·조건 설명이며 교수자의 발화가 아닙니다. 교정된 구간은 원시 단어별 시각과 텍스트가 달라지므로 `words=null`로 처리합니다. 피스톤 적분 및 점성일 유도의 실제 자기수정 발화는 유지합니다.

캡션과 대응표의 시각은 각 Part 시작 기준 주제 구간입니다. 정확한 슬라이드 전환 시각을 의미하지 않으며, 다시 설명한 14쪽에는 두 구간이 있습니다. 영상 속 수학·AI 관련 일화는 확인된 학술 사실로 채택하지 않습니다.

Part 2의 주요 대조 항목은 no-slip, ψ·φ, Couette, Cauchy–Riemann, 적분 지수·미분 기호입니다. 등온과 단열, ψ와 베르누이 상수, 비점성과 비회전처럼 정의가 다른 개념은 발화를 임의로 고치지 않고 주석과 노트의 별도 편집자 보강으로 구분합니다. PDF 43쪽 원형 그림의 Couette 표기는 영상에서 실제로 지우고 퍼텐셜 와류로 설명합니다. PDF 51·52쪽의 채택식은 직접 미분·대수 검산으로 제시합니다.

## 비공개 자료 경계

원본 영상과 원시 전사는 Git에서 제외합니다. 공개 검수본에는 영상 파일 경로·접속 토큰을 넣지 않았습니다. 읽은 전사에서 개인정보 발화는 발견하지 못했습니다.

## 재현

저장소 루트에서 원시 전사가 있는 로컬 환경에 한해 실행합니다.

```powershell
python 2026FA_FluidMechanics/scripts/review_transcript.py private-materials/transcription-staging/lecture05/lecture.json 2026FA_FluidMechanics/transcripts/lecture05/corrections.json 2026FA_FluidMechanics/transcripts/lecture05 --force
python 2026FA_FluidMechanics/scripts/review_transcript.py private-materials/transcription-staging/lecture05/part02/lecture.json 2026FA_FluidMechanics/transcripts/lecture05/part02/corrections.json 2026FA_FluidMechanics/transcripts/lecture05/part02 --force
```
