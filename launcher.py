"""
동물 슈팅 게임 — Python 런처
pywebview를 이용해 HTML 게임을 네이티브 창에서 실행합니다.
PyInstaller로 exe 빌드 시 --add-data 옵션으로 HTML/CSS/JS가 함께 패키징됩니다.
"""

import os
import sys
import webview


def resource(rel_path: str) -> str:
    """PyInstaller 번들 또는 개발 환경 양쪽에서 리소스 절대 경로를 반환."""
    if hasattr(sys, '_MEIPASS'):
        base = sys._MEIPASS
    else:
        base = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base, rel_path)


def main():
    html_path = resource('index.html')
    url = f'file:///{html_path.replace(os.sep, "/")}'

    window = webview.create_window(
        title     = '동물 슈팅 게임',
        url       = url,
        width     = 840,
        height    = 660,
        resizable = False,
        min_size  = (840, 660),
    )
    webview.start(debug=False)


if __name__ == '__main__':
    main()
