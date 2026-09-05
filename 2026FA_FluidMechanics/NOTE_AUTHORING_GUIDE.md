# MC2102 Fluid Mechanics 렉처 집필·검증 규격

버전: 2.0

형식 기준: [Lecture 1](site/lecture01.html)과 [렉처 템플릿](site/templates/lecture-page.template.html)

목적: 영어 강의의 개념과 수식을 한국어로 이해하고 영어 시험 답안까지 준비할 수 있는 독립형 학습 자료 제작

## 1. 자료의 역할

1. **수업 대체:** 문장 번역을 넘어 개념의 이유, 관계, 사용 상황과 가정을 설명합니다.
2. **원본 보존:** PDF의 모든 페이지를 순서대로 포함합니다. 표지·구분·참고문헌 페이지도 생략하지 않습니다.
3. **시험 대비:** 핵심 개념어와 상태·문제 지시 표현을 `English(한국어)`로 반복 표기하고 영어 모범답안을 제공합니다.
4. **근거 통제:** 원자료와 편집자 보강을 구분하고 스크립트 오인식 및 원본 오류의 판단 근거를 남깁니다.

## 2. 입력 자료와 우선순위

[강의 인덱스](강의_인덱스.md)에서 렉처 번호, 주차, 날짜, PDF와 스크립트를 확인합니다. 날짜가 없으면 `날짜 미기재`로 유지합니다.

한 렉처의 입력은 원본 PDF, 가림막 제거 PDF, 영어 강의 한 편과 그 강의의 타임스탬프 포함 스크립트입니다. 모든 시각은 하나의 연속된 강의 시간축을 사용합니다.

내용의 우선순위는 다음과 같습니다.

1. PDF에 명시된 수식·기호·정의·도표
2. 해당 시점 강의의 실제 설명과 문맥
3. 검수한 영어 스크립트
4. 강의 인덱스의 운영 정보
5. 출처를 확인한 표준 정의와 편집자 보강

충돌을 조용히 섞지 않습니다. 스크립트 오인식은 PDF·강의 문맥과 대조하고, PDF 자체가 수학적 관계나 표준 정의와 충돌하면 `원본 표기 교정`과 근거를 표시합니다. 확정할 수 없는 표기는 `원문 확인 필요`로 남기며 확정된 계산식으로 사용하지 않습니다.

강의자료 밖의 추가 예시·유도·적용 조건은 `편집자 보강` 또는 `시험용 보강`으로 명시합니다. 실제 출제 여부, 교수자의 의도와 운영 일정은 추정하지 않습니다.

## 3. 고정 HTML 구조

새 렉처는 반드시 템플릿을 복제한 뒤 내용 자리표시자와 반복 블록을 채웁니다. Lecture 1을 유일한 시각·구조 기준으로 사용합니다.

고정 순서는 다음과 같습니다.

`hero → overview → concept-map → concept-summary → 모든 source-section → exam-english → glossary → asr-log → sources`

| 섹션 | 정확한 class | 제목 연결 |
|---|---|---|
| overview | editorial-section section-divider | overview-title |
| concept-map | editorial-section | map-title |
| concept-summary | editorial-section | concept-summary-title |
| slide-NN | source-section | slide-NN-title |
| exam-english | editorial-section | exam-title |
| glossary | editorial-section | glossary-title |
| asr-log | editorial-section | asr-title |
| sources | editorial-section | sources-title |

모든 섹션은 위 제목 ID를 `aria-labelledby`로 참조하고, 제목은 `h2.section-title`로 작성합니다. 작은 제목은 순서대로 `Lecture overview`, `Concept map`, `Content summary`, `Source slide NN · 역할`, `Exam English`, `Core glossary`, `Transcript audit`, `Sources`입니다.

### 3.1 개요와 개념 지도

- `overview`는 작은 제목, 짧은 문장형 h2, 핵심 관계를 설명하는 lead 문단만 둡니다. 통계 카드나 근거 칩을 넣지 않습니다.
- 큰 제목은 한 가지 개념이나 관계를 식별합니다. 가정·정의·수식 전체를 제목에 몰아넣지 않습니다.
- `course-map`은 `course-map__card → course-map__arrow → course-map__card`의 두 개념 연결 전용입니다.
- 세 개 이상의 동등한 항목에는 `grid-2` 또는 `grid-3`를 사용합니다. 긴 해설은 한 열 카드 또는 두 열로 배치합니다.

### 3.2 핵심 개념 요약

핵심 질문, 정의, 개념 관계, 모델링 가정, 관계식과 풀이 흐름을 하나의 설명으로 연결합니다. 요약만 읽어도 주요 내용을 이해할 수 있어야 하며, 요약을 추가했다는 이유로 상세 해설을 줄이지 않습니다.

`note-stack` 안에서 정의는 `callout`, 비교는 `grid-2 > card`, 관계식과 일반 해설은 `card`, 풀이 흐름은 `exam-card`, 마지막 연결 문단은 `quiet-card`를 사용할 수 있습니다. 마지막에 근거 슬라이드와 강의 시각을 둡니다.

강의 말미의 복습은 실제 내용을 확인해 요약의 근거로 활용합니다. 앞으로 배울 단원 안내는 현재 렉처의 개념으로 섞지 않고 해당 슬라이드 설명에서 짧게 다룹니다.

### 3.3 시험 영어와 표

- `exam-english`는 `note-stack > exam-card > answer > answer__label` 구조를 사용합니다.
- 각 문항은 h3, `Model answer` 라벨이 있는 영어 답안, 한국어 해설 순서입니다.
- `exam-english`에 `section-divider`를 사용하지 않습니다.
- `term-table`과 `compare-table`은 `table` 요소에만 사용하고 `thead`, `tbody`, `tr`, `th`, `td`로 구성합니다.
- 교정 기록의 ID는 항상 `asr-log`입니다.

## 4. 읽기와 다운로드

### 4.1 메인 페이지

각 완성된 렉처 카드의 버튼은 다음 순서입니다.

1. `Lecture N 읽기`: `class="button button--primary"`, 해당 HTML로 연결
2. `가림막 제거 PDF`: `class="button"`
3. `원본 PDF`: `class="button"`

상단 표지의 강조 버튼도 읽기 링크입니다. 자료 수, 날짜와 주제 등 메타데이터는 학습자가 자료를 고르는 데 필요한 내용으로 작성합니다.

### 4.2 렉처 표지

번호, 주차, 제목, 날짜, 슬라이드 수, 영어 스크립트 대조 여부를 표시합니다. 표지 버튼은 모두 중립색이며 `가림막 제거 PDF 다운로드 → 원본 PDF 다운로드 → 강의 목록` 순서입니다.

### 4.3 PDF 페이지

렉처별 가림막 제거본과 원본을 같은 단계의 카드로 제공합니다. 각 카드에 버전, 페이지 수, 파일 크기와 용도를 표시합니다. 두 다운로드 버튼은 중립색입니다.

PDF 링크는 저장소 `lecture_notes/`의 GitHub raw URL을 사용하고 `download` 속성에 실제 파일명, `type` 속성에 `application/pdf`를 넣습니다. 원본은 `lectureNN_original.pdf`, 제거본은 `lectureNN_note.pdf`입니다.

## 5. 슬라이드별 배치

- PDF 한 페이지마다 정확히 하나의 `section.source-section`을 둡니다.
- 순서는 작은 제목 → h2 → `figure.source-slide` → `div.note-stack`입니다.
- figure 안에는 `div.source-slide__frame > img`와 `figcaption`을 둡니다.
- 이미지 해상도는 `1440×1080`, 프레임은 `4:3`이며 모든 슬라이드에 같은 크기·테두리·캡션 규칙을 적용합니다.
- 캡션은 원본 페이지 번호와 강의 시각 또는 페이지 역할을 담습니다.
- 그림·표·수식·축·기호를 자르거나 왜곡하지 않습니다.
- 설명이 길면 같은 섹션 안에 카드를 추가하며 이미지를 중복하지 않습니다.
- 표지·구분 페이지는 `quiet-card`로 역할만 식별하고 억지 해설을 만들지 않습니다.

## 6. 해설 집필

개념별로 필요한 범위에서 다음 내용을 포함합니다.

- 정의가 구분하는 대상과 물리적 의미
- 앞뒤 개념과의 연결, 이후 계산에서의 역할
- 수식의 기호, 단위, 부호, 가정과 적용 범위
- 유사 개념과의 구분 및 흔한 오해
- 영어 문제의 질문 표현과 답안 전환

먼저 완전한 문장으로 설명합니다. 비교는 표, 실제 순서가 있는 풀이는 목록을 사용합니다. 이름이나 번역 목록만으로 핵심 해설을 대신하지 않습니다.

예제는 주어진 조건 → 좌표·경계 선택 → 가정 → 관계식 → 식의 전개 → 결과 → 차원 및 물리적 해석 순서로 풉니다. 원자료에 수치가 없으면 임의 수치를 강의 예제로 만들지 않습니다.

## 7. 이중언어와 문체

중요한 용어는 처음뿐 아니라 정의·비교·풀이 지점에서도 `English(한국어)`로 반복합니다.

- 개념어: `fluid(유체)`, `density(밀도)`, `control volume(검사체적)`
- 상태·가정: `steady(정상인)`, `incompressible(비압축성인)`, `Newtonian(뉴턴형인)`
- 지시 표현: `determine(구하라)`, `derive(유도하라)`, `assume(가정하라)`, `neglect(무시하라)`

기호와 첨자를 유지하며 `μ`와 `ν`, 압력과 증기압, 질량과 중량을 명확히 구분합니다. 일반 접속사나 일상어까지 과도하게 병기하지 않습니다.

공개 문서는 중립적인 학술 문체로 작성합니다. 다른 과목의 사이트, 이식 과정, 제작자 대화, 개인 설정, 농담과 변경 이유를 설명하지 않습니다. 독자가 개념을 이해하는 데 필요한 원자료의 오류·차이는 근거와 함께 설명합니다. 도구 설치와 전처리는 `scripts/README.md`에 둡니다.

## 8. 전사와 원자료 관리

- 전사는 `transcribe_english.py`로 수행하며 원시 결과는 `private-materials/transcription-staging/`에 둡니다.
- 타임스탬프와 원시 결과를 보존하며 전문용어·수식·원문 맥락을 대조합니다.
- 불확실한 발화를 뜻이 맞아 보이는 문장으로 채우지 않습니다.
- 검수본은 `transcripts/lectureNN/`에 TXT·SRT·JSON으로 보관합니다.
- 녹화·음성·모델 캐시·선배 자료는 Git에서 제외합니다.
- PDF 가림막 제거는 원본을 덮어쓰지 않고 새 파일을 생성합니다.
- 제거 뒤 페이지 수, 추출 텍스트와 변경 페이지를 확인합니다.

## 9. 공통 디자인과 접근성

색상·글꼴·여백·카드 스타일은 공통 CSS를 사용합니다. 특정 렉처에 독자적인 색이나 스타일을 추가하지 않습니다. 디자인 토큰의 보조 참고는 `design_reference/crimson2.md`이며 HTML 레이아웃은 Lecture 1과 템플릿이 결정합니다.

기능색은 `#BF2B25`, 글꼴은 Pretendard 계열, 기본 간격은 4px 배수입니다. 설명은 한 방향으로 스크롤하여 읽고 핵심 내용은 JavaScript 없이도 표시합니다.

이미지 alt에는 슬라이드 번호 또는 식별 가능한 내용을 포함합니다. 목차는 섹션을 빠짐없이 같은 순서로 가리킵니다. 표와 수식은 모바일에서 잘리거나 문서 전체 가로 넘침을 만들지 않아야 합니다.

## 10. 제작 절차와 완료 조건

1. 인덱스·PDF·스크립트를 읽고 강의 범위를 확정합니다.
2. 전 페이지를 시각 검토하고 시각과 개념을 대응시킵니다.
3. 오류·확인 필요 항목과 편집자 보강을 구분합니다.
4. 템플릿을 복제하고 독립 요약과 상세 설명을 작성합니다.
5. 시험 영어, 용어집, 교정표와 출처를 완성합니다.
6. 읽기·PDF 버튼, README와 인덱스를 갱신합니다.
7. 아래 검사와 실제 브라우저 확인을 수행합니다.
8. 모든 항목을 통과한 렉처를 `ready: true`로 등록합니다.

저장소 루트에서 실행합니다.

```powershell
node 2026FA_FluidMechanics/scripts/validate_site.mjs
node --test 2026FA_FluidMechanics/scripts/lecture_layout.test.mjs
python 2026FA_FluidMechanics/scripts/validate_lecture_site.py 2026FA_FluidMechanics/site lecture01.html 23
```

완료를 판단할 때는 파일 개수만 확인하지 않습니다. 데스크톱·모바일에서 메인 읽기 버튼, 개념 지도, 비교표·수식, 시험 영어 답안의 색상과 첫·마지막 슬라이드를 실제로 확인합니다. 섹션 순서·ID·class·제목 연결, 카드 중첩, 버튼 순서·강조는 자동 검사에 포함합니다.

원자료·검수 스크립트·전처리 도구의 변경이 필요 없는 작업에서는 해당 파일을 보존합니다. 배포가 승인된 작업은 검증 후 반영하고 실제 공개 페이지와 링크까지 확인합니다.
