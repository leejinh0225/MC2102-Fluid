# Fluid Mechanics 1 학습 노트 사이트

GitHub Pages에 배포할 수 있는 무의존성 정적 사이트입니다. 비공개 강의 녹화는 포함하지 않으며, 공개가 승인된 두 종류의 PDF와 완성된 학습 노트만 연결합니다.

## 페이지

- `index.html`: 강의 목록과 렉처별 PDF 바로가기
- `downloads.html`: 가림막 제거본·원본 PDF 다운로드
- `lecture01.html`: Chapter 1 한국어 수업 대체·시험 대비 노트
- `templates/lecture-page.template.html`: 이후 렉처용 구조 템플릿

## 주요 자산

- `assets/css/styles.css`: crimson 장문 읽기 디자인 시스템
- `assets/js/site.js`: 스크롤 진행률과 현재 목차 표시
- `assets/slides/lectureXX/`: 1440×1080, 4:3 원본 슬라이드 렌더링 이미지
- `../lecture_notes/lectureXX_note.pdf`: 공개 가림막 제거본
- `../lecture_notes/lectureXX_original.pdf`: 공개 원본 배포 사본

사이트의 PDF 버튼은 공개 GitHub 저장소의 raw URL을 직접 사용합니다. `private-materials`의 변경 금지 원본 백업, 녹화, 추출 음성, 선배 자료는 사이트에 연결하지 않습니다.

## 로컬 확인

저장소 루트에서 `node 2026FA_FluidMechanics/scripts/validate_site.mjs`를 실행합니다. 완성된 렉처를 추가할 때는 manifest의 PDF 두 파일명, 다운로드 페이지, 강의 목록 카드, 렉처 hero를 함께 갱신합니다.
