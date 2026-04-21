import os
import requests
from dotenv import load_dotenv
from urllib.parse import unquote

# --------------------------------------------------
# 1. LH 공공데이터 API 테스트
# --------------------------------------------------
def test_lh_api():
    print("\n[1] LH API 테스트 중...")
    key = unquote(os.getenv("PUBLIC_DATA_API_KEY", "").strip())
    if not key:
        print("❌ .env 에 PUBLIC_DATA_API_KEY 가 없습니다.")
        return

    # 공고 목록 조회 API
    url = "http://apis.data.go.kr/B552555/lhLeaseNoticeInfo1/lhLeaseNoticeInfo1"
    try:
        # 이중 인코딩 방지를 위해 URL에 직접 결합
        req_url = f"{url}?serviceKey={key}&PG_SZ=5&PAGE=1"
        resp = requests.get(req_url, timeout=10)
        
        if resp.status_code == 200:
            if "TotalCount" in resp.text or "dsList" in resp.text:
                print("✅ LH API 성공: 데이터 수신 완료")
            else:
                print("⚠️ 상태는 200 이지만 데이터 내용이 비정상입니다.")
                print(f"응답 본문: {resp.text[:150]}")
        elif resp.status_code == 403:
            print("❌ LH API 실패: 403 Forbidden (활용 신청 승인 대기 또는 키 오류)")
        else:
            print(f"❌ LH API 실패: HTTP {resp.status_code}")
    except Exception as e:
        print(f"❌ LH API 통신 오류: {e}")

# --------------------------------------------------
# 2. VWorld 위경도 API 테스트
# --------------------------------------------------
def test_vworld_api():
    print("\n[2] VWorld API 테스트 중...")
    key = os.getenv("VWORLD_API_KEY", "").strip()
    if not key:
        print("❌ .env 에 VWORLD_API_KEY 가 없습니다.")
        return

    url = "http://api.vworld.kr/req/address"
    params = {
        "service": "address", "request": "getcoord", "version": "2.0",
        "crs": "epsg:4326", "address": "가락동", "refine": "true",
        "format": "json", "type": "road", "key": key
    }
    
    try:
        resp = requests.get(url, params=params, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("response", {}).get("status") == "OK":
                coords = data["response"]["result"]["point"]
                print(f"✅ VWorld 성공: 좌표 획득 ({coords['y']}, {coords['x']})")
            else:
                error = data.get("response", {}).get("error", {}).get("text", "알 수 없는 오류")
                print(f"❌ VWorld 실패: {error}")
        else:
            print(f"❌ VWorld HTTP 에러: {resp.status_code}")
    except Exception as e:
        print(f"❌ VWorld 통신 오류: {e}")

# --------------------------------------------------
# 3. SH API (OA-12918) 테스트
# --------------------------------------------------
def test_sh_api():
    print("\n[3] SH API (국민임대 공급계획) 테스트 중...")
    key = os.getenv("SEOUL_OPEN_API_KEY", "").strip()
    if not key:
        print("❌ .env 에 SEOUL_OPEN_API_KEY 가 없습니다.")
        return

    # 제공하신 OA-12918의 서비스 명칭은 'ShGnpiUks' 입니다.
    service_name = "ShGnpiUks"
    url = f"http://openapi.seoul.go.kr:8088/{key}/json/{service_name}/1/5/"
    
    try:
        resp = requests.get(url, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if "RESULT" in data and data["RESULT"].get("CODE") == "INFO-000":
                print(f"✅ SH API 성공: '{service_name}' 데이터 수신 완료")
            elif "ShGnpiUks" in data:
                print(f"✅ SH API 성공: 데이터 수신 완료 ({data['ShGnpiUks']['list_total_count']}건)")
            else:
                code = data.get("RESULT", {}).get("CODE", "UNKNOWN")
                msg = data.get("RESULT", {}).get("MESSAGE", "알 수 없는 서버 오류")
                print(f"❌ SH API 실패 ({code}): {msg}")
        else:
            print(f"❌ SH API HTTP 에러: {resp.status_code}")
    except Exception as e:
        print(f"❌ SH API 통신 오류: {e}")

# --------------------------------------------------
# 4. Supabase DB 연결 테스트
# --------------------------------------------------
def test_supabase_api():
    print("\n[4] Supabase 연결 테스트 중...")
    url = os.getenv("SUPABASE_URL", "").strip()
    key = os.getenv("SUPABASE_SERVICE_KEY", "").strip()
    
    if not url or not key:
        print("❌ SUPABASE_URL 또는 SERVICE_KEY 가 누락되었습니다.")
        return

    try:
        # DB 연결성 테스트 (REST API 호출)
        resp = requests.get(f"{url}/rest/v1/", headers={"apikey": key}, timeout=5)
        if resp.status_code in [200, 404]: # 연결만 되면 성공
            print("✅ Supabase 성공: 서버 연결 확인")
        else:
            print(f"❌ Supabase 실패: HTTP {resp.status_code}")
    except requests.exceptions.ConnectionError:
        print(f"❌ Supabase 실패: 호스트({url})를 찾을 수 없습니다.")
    except Exception as e:
        print(f"❌ Supabase 기타 오류: {e}")

if __name__ == "__main__":
    load_dotenv(override=True)
    print("\n" + "="*50)
    print("      ZIPSTEP API 전체 무결성 진단 시작")
    print("="*50)
    
    test_lh_api()
    test_vworld_api()
    test_sh_api()
    test_supabase_api()
    
    print("\n" + "="*50)
    print("진단 완료.")
