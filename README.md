# MC2102 Fluid Mechanics 학습 저장소

2026 Fall 유체역학 1의 강의자료, 영어 스크립트와 한국어 학습 노트입니다.

**[학습 노트 읽기](https://leejinh0225.github.io/MC2102-Fluid/)** · [PDF 다운로드](https://leejinh0225.github.io/MC2102-Fluid/downloads.html)

## 완성된 렉처

| 렉처 | 주제 | 읽기 | 강의자료 |
|---|---|---|---|
| Lecture 1 | Introduction to Fluid Mechanics | [Lecture 1 읽기](https://leejinh0225.github.io/MC2102-Fluid/lecture01.html) | [가림막 제거 PDF](./2026FA_FluidMechanics/lecture_notes/lecture01_note.pdf) · [원본 PDF](./2026FA_FluidMechanics/lecture_notes/lecture01_original.pdf) |
| Lecture 2 | Pressure Distribution in a Fluid | [Lecture 2 읽기](https://leejinh0225.github.io/MC2102-Fluid/lecture02.html) | [가림막 제거 PDF](./2026FA_FluidMechanics/lecture_notes/lecture02_note.pdf) · [원본 PDF](./2026FA_FluidMechanics/lecture_notes/lecture02_original.pdf) |
| Lecture 3 | Integral Relations for a Control Volume | [Lecture 3 읽기](https://leejinh0225.github.io/MC2102-Fluid/lecture03.html) | [가림막 제거 PDF](./2026FA_FluidMechanics/lecture_notes/lecture03_note.pdf) · [원본 PDF](./2026FA_FluidMechanics/lecture_notes/lecture03_original.pdf) |

Lecture 1은 원본 슬라이드 23장, 핵심 개념 요약, 슬라이드별 해설, 시험 영어, 용어집과 스크립트 교정 기록을 포함합니다. [영어 스크립트 TXT](./2026FA_FluidMechanics/transcripts/lecture01/lecture.txt), [자막 SRT](./2026FA_FluidMechanics/transcripts/lecture01/lecture.srt), [타임스탬프 JSON](./2026FA_FluidMechanics/transcripts/lecture01/lecture.json)도 함께 제공합니다.

## 작성 원칙

Lecture 2는 슬라이드 32장과 영어 강의 세 편을 대조하여 정수압·액주계·수문 합력·부력·강체 운동을 설명합니다. [Part 1·2·3 스크립트와 검수 안내](./2026FA_FluidMechanics/transcripts/lecture02/README.md)를 함께 제공합니다.

Lecture 3는 슬라이드 54장과 검사체적의 질량·운동량·에너지 해석을 다룹니다. 1–36쪽은 [Part 1·2 스크립트](./2026FA_FluidMechanics/transcripts/lecture03/README.md)와 대조했으며, 37–54쪽은 대응 영상 미제공으로 PDF 기반 해설입니다. 제공된 Part 4는 Chapter 2 복습이므로 Chapter 3의 근거에 포함하지 않았습니다.

원본 슬라이드를 순서대로 보존하고 영어 강의 설명과 대조합니다. 핵심 정의, 개념 간 관계, 수식의 가정과 단위를 한국어로 설명하며 중요한 시험 용어는 `English(한국어)`로 반복 표기합니다. 원자료에 없는 설명은 `편집자 보강`으로 표시합니다.

## 저장소 구성

- [강의 인덱스](./2026FA_FluidMechanics/강의_인덱스.md): 렉처별 주제, 자료와 읽기 링크
- [집필·검증 규격](./2026FA_FluidMechanics/NOTE_AUTHORING_GUIDE.md): 공통 구성, 디자인과 설명 기준
- [사이트](./2026FA_FluidMechanics/site/): GitHub Pages에 배포되는 HTML과 공통 자산
- [강의자료](./2026FA_FluidMechanics/lecture_notes/): 가림막 제거본과 원본 PDF
- [영어 스크립트](./2026FA_FluidMechanics/transcripts/): 렉처별 TXT·SRT·JSON
- [전처리·검증 도구](./2026FA_FluidMechanics/scripts/README.md): PDF 가림막 제거, 슬라이드 렌더링, Whisper 전사와 검사

## 로컬 실행과 검증

저장소 루트에서 실행합니다.

```powershell
node 2026FA_FluidMechanics/scripts/validate_site.mjs
node --test 2026FA_FluidMechanics/scripts/lecture_layout.test.mjs
python -m http.server 8765 --directory 2026FA_FluidMechanics/site
```

브라우저에서 `http://127.0.0.1:8765/`를 열면 됩니다. 원본 녹화·추출 음성·선배 자료와 모델 캐시는 `private-materials/`에서 로컬로 관리하며 Git에서 제외합니다.
