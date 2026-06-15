# Shooting_Game — Claude 가이드

HTML5 Canvas 기반 12지신 동물 슈팅 게임 프로젝트입니다.

## 기술 스택

- **프론트엔드**: HTML5 Canvas, CSS3, Vanilla JavaScript (ES6+)
- **Python**: `launcher.py` (pywebview 런처, PyInstaller EXE 빌드용)
- **빌드 도구**: PyInstaller + build.bat

## 핵심 파일

| 파일 | 역할 |
|------|------|
| `game.js` | 전체 게임 로직 (상태 관리, 드로잉, 충돌 판정) |
| `index.html` | 게임 캔버스 + HUD + 오버레이 화면 |
| `style.css` | UI 스타일 (overlay, HUD, 버튼 등) |
| `launcher.py` | pywebview 기반 Python 런처 |

## 게임 구조 (game.js)

- **상태**: `title → playing → stageclear → (다음단계 or victory) | gameover`
- **플레이어**: `CAR_STATS` 객체로 차량별 속도/발사속도 정의
- **적 동물**: `ZODIAC` 배열 (12지신, 인덱스 0=쥐~11=돼지)
- **스테이지 진행**: `killsNeeded = stage * 5 + 5`
- **스폰 간격**: `max(30, 100 - stage * 5)` 프레임

## 주요 함수 위치

- `selectCar(type)` — 타이틀에서 차량 선택 후 게임 시작
- `initStage()` — 각 스테이지 초기화
- `update()` — 매 프레임 게임 로직
- `draw()` — 매 프레임 렌더링
- `sportsCar/truck/convertible(ctx,x,y,col)` — 차량 드로잉
- `drawEnemy(e)` — 동물 emoji + HP바 렌더링

## 주의사항

- `roundRect`는 브라우저 호환성을 위해 자체 `rr()` 함수로 구현 (`arcTo` 방식)
- 자동 발사는 항상 활성화 (`player.cool` 카운트다운 방식)
- `dist/` 폴더는 .gitignore 처리 (PyInstaller 빌드 산출물)
