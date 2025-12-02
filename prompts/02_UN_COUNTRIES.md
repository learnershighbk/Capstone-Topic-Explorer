# Prompt: UN 193 Member Countries

## 목적
Step 1 "Define Your Scope"에서 사용할 UN 193개 회원국 데이터 및 선택 컴포넌트 구현

---

## 프롬프트

```
UN 193개 회원국 데이터 파일과 국가 선택 컴포넌트를 만들어줘.

## 요구사항

### 1. 데이터 파일 (src/data/un-countries.ts)
- UN 193개 회원국 전체 목록
- 정렬 규칙:
  - South Korea (한국)이 **반드시** 첫 번째
  - 나머지 국가는 영문 이름 알파벳순
- 각 국가 데이터 구조:
  ```typescript
  interface Country {
    code: string;      // ISO 3166-1 alpha-2 (예: KR, US, JP)
    name: string;      // 영문 국가명
    nameKo?: string;   // 한글 국가명 (선택)
  }
  ```
- 헬퍼 함수:
  - searchCountries(query: string): 국가명 검색 (영문/한글)
  - getCountryByCode(code: string): 코드로 국가 찾기
  - getCountryByName(name: string): 이름으로 국가 찾기

### 2. CountrySelect 컴포넌트 (src/components/common/CountrySelect.tsx)
- 드롭다운 형태의 국가 선택기
- 검색 기능 포함 (입력창에서 국가명 검색)
- 한국이 항상 최상단에 "우선" 배지와 함께 표시
- Props:
  ```typescript
  interface CountrySelectProps {
    value: string;
    onChange: (country: string) => void;
    placeholder?: string;
  }
  ```

### 3. API Route (src/app/api/countries/route.ts)
- GET /api/countries
- 전체 국가 목록 반환

## 참고: UN 193개 회원국 전체 목록

A: Afghanistan, Albania, Algeria, Andorra, Angola, Antigua and Barbuda, Argentina, Armenia, Australia, Austria, Azerbaijan
B: Bahamas, Bahrain, Bangladesh, Barbados, Belarus, Belgium, Belize, Benin, Bhutan, Bolivia, Bosnia and Herzegovina, Botswana, Brazil, Brunei, Bulgaria, Burkina Faso, Burundi
C: Cabo Verde, Cambodia, Cameroon, Canada, Central African Republic, Chad, Chile, China, Colombia, Comoros, Congo (Democratic Republic), Congo, Costa Rica, Côte d'Ivoire, Croatia, Cuba, Cyprus, Czechia
D: Denmark, Djibouti, Dominica, Dominican Republic
E: Ecuador, Egypt, El Salvador, Equatorial Guinea, Eritrea, Estonia, Eswatini, Ethiopia
F: Fiji, Finland, France
G: Gabon, Gambia, Georgia, Germany, Ghana, Greece, Grenada, Guatemala, Guinea, Guinea-Bissau, Guyana
H: Haiti, Honduras, Hungary
I: Iceland, India, Indonesia, Iran, Iraq, Ireland, Israel, Italy
J: Jamaica, Japan, Jordan
K: Kazakhstan, Kenya, Kiribati, North Korea, South Korea, Kuwait, Kyrgyzstan
L: Laos, Latvia, Lebanon, Lesotho, Liberia, Libya, Liechtenstein, Lithuania, Luxembourg
M: Madagascar, Malawi, Malaysia, Maldives, Mali, Malta, Marshall Islands, Mauritania, Mauritius, Mexico, Micronesia, Moldova, Monaco, Mongolia, Montenegro, Morocco, Mozambique, Myanmar
N: Namibia, Nauru, Nepal, Netherlands, New Zealand, Nicaragua, Niger, Nigeria, North Macedonia, Norway
O: Oman
P: Pakistan, Palau, Panama, Papua New Guinea, Paraguay, Peru, Philippines, Poland, Portugal
Q: Qatar
R: Romania, Russia, Rwanda
S: Saint Kitts and Nevis, Saint Lucia, Saint Vincent and the Grenadines, Samoa, San Marino, Sao Tome and Principe, Saudi Arabia, Senegal, Serbia, Seychelles, Sierra Leone, Singapore, Slovakia, Slovenia, Solomon Islands, Somalia, South Africa, South Sudan, Spain, Sri Lanka, Sudan, Suriname, Sweden, Switzerland, Syria
T: Tajikistan, Tanzania, Thailand, Timor-Leste, Togo, Tonga, Trinidad and Tobago, Tunisia, Turkey, Turkmenistan, Tuvalu
U: Uganda, Ukraine, United Arab Emirates, United Kingdom, United States, Uruguay, Uzbekistan
V: Vanuatu, Venezuela, Vietnam
Y: Yemen
Z: Zambia, Zimbabwe

총 193개국 확인!

## 디자인 요구사항
- Tailwind CSS 사용
- 드롭다운 최대 높이: 240px (스크롤)
- 검색창은 드롭다운 상단에 고정
- 선택된 국가는 파란색 배경으로 하이라이트
- 한국은 구분선과 "우선" 배지로 강조
```

---

## 예상 결과

1. `src/data/un-countries.ts` - 193개국 데이터 + 헬퍼 함수
2. `src/components/common/CountrySelect.tsx` - 검색 가능한 드롭다운
3. `src/app/api/countries/route.ts` - API 라우트

---

## 검증 체크리스트

- [ ] 정확히 193개국인지 확인
- [ ] South Korea가 첫 번째인지 확인
- [ ] 나머지가 알파벳순인지 확인
- [ ] 검색 기능 동작 확인
- [ ] 한글 검색 지원 확인

---

## 다음 단계

→ `03_AUTH_SYSTEM.md` 실행
