# MC2102 Fluid Mechanics 학습 노트 사이트

[공개 사이트](https://leejinh0225.github.io/MC2102-Fluid/) · [Lecture 1 읽기](https://leejinh0225.github.io/MC2102-Fluid/lecture01.html)

## 페이지와 자산

- `index.html`: 렉처 목록. 강조된 읽기 버튼과 중립색 PDF 두 버튼
- `downloads.html`: 렉처별 가림막 제거본·원본 PDF
- `lecture01.html`: 공통 레이아웃과 집필 방식의 기준 페이지
- `templates/lecture-page.template.html`: 새 렉처를 시작할 때 복제하는 템플릿
- `assets/css/styles.css`: 색상·글꼴·여백·카드·표·반응형 배치
- `assets/js/site.js`: 스크롤 진행률과 현재 목차 표시
- `assets/slides/lectureXX/`: 1440×1080, 4:3 슬라이드 이미지
- `data/lectures.json`: 완성 상태, 페이지 수와 PDF 파일명

## 작성과 검증

[집필·검증 규격](../NOTE_AUTHORING_GUIDE.md)에 따라 템플릿의 내용 자리표시자와 반복 블록을 채웁니다. `overview → concept-map → concept-summary → source-section → exam-english → glossary → asr-log → sources` 순서와 카드 중첩을 유지합니다.

저장소 루트에서 다음 명령을 실행합니다.

```powershell
node 2026FA_FluidMechanics/scripts/validate_site.mjs
node --test 2026FA_FluidMechanics/scripts/lecture_layout.test.mjs
python 2026FA_FluidMechanics/scripts/validate_lecture_site.py 2026FA_FluidMechanics/site lecture01.html 23
python -m http.server 8765 --directory 2026FA_FluidMechanics/site
```

이미지 검사에는 Pillow가 필요합니다. 자동 검사 후 실제 브라우저에서 읽기 버튼, 목차, 개념 지도, 수식·표, 시험 영어 카드, 첫·마지막 슬라이드와 모바일 폭을 확인합니다.

## 배포

`main`에 반영하면 GitHub Actions가 검증 후 이 폴더를 Pages에 배포합니다. PDF는 `../lecture_notes/`의 GitHub raw URL을 사용합니다. 공개 주소는 위의 학습 노트 홈입니다.
