# UN 193 Member Countries Data

## 개요

Step 1 "Define Your Scope"에서 사용할 UN 193개 회원국 데이터입니다.
- South Korea (한국)이 최상단에 위치
- 나머지 국가는 알파벳순 정렬

---

## 데이터 파일

### `src/data/un-countries.ts`

```typescript
export interface Country {
  code: string;      // ISO 3166-1 alpha-2 코드
  name: string;      // 영문 국가명
  nameKo?: string;   // 한글 국가명 (선택)
}

// UN 193개 회원국 (South Korea 우선, 나머지 알파벳순)
export const UN_COUNTRIES: Country[] = [
  // Priority: South Korea first
  { code: 'KR', name: 'South Korea', nameKo: '대한민국' },
  
  // Alphabetical order
  { code: 'AF', name: 'Afghanistan', nameKo: '아프가니스탄' },
  { code: 'AL', name: 'Albania', nameKo: '알바니아' },
  { code: 'DZ', name: 'Algeria', nameKo: '알제리' },
  { code: 'AD', name: 'Andorra', nameKo: '안도라' },
  { code: 'AO', name: 'Angola', nameKo: '앙골라' },
  { code: 'AG', name: 'Antigua and Barbuda', nameKo: '앤티가 바부다' },
  { code: 'AR', name: 'Argentina', nameKo: '아르헨티나' },
  { code: 'AM', name: 'Armenia', nameKo: '아르메니아' },
  { code: 'AU', name: 'Australia', nameKo: '호주' },
  { code: 'AT', name: 'Austria', nameKo: '오스트리아' },
  { code: 'AZ', name: 'Azerbaijan', nameKo: '아제르바이잔' },
  { code: 'BS', name: 'Bahamas', nameKo: '바하마' },
  { code: 'BH', name: 'Bahrain', nameKo: '바레인' },
  { code: 'BD', name: 'Bangladesh', nameKo: '방글라데시' },
  { code: 'BB', name: 'Barbados', nameKo: '바베이도스' },
  { code: 'BY', name: 'Belarus', nameKo: '벨라루스' },
  { code: 'BE', name: 'Belgium', nameKo: '벨기에' },
  { code: 'BZ', name: 'Belize', nameKo: '벨리즈' },
  { code: 'BJ', name: 'Benin', nameKo: '베냉' },
  { code: 'BT', name: 'Bhutan', nameKo: '부탄' },
  { code: 'BO', name: 'Bolivia', nameKo: '볼리비아' },
  { code: 'BA', name: 'Bosnia and Herzegovina', nameKo: '보스니아 헤르체고비나' },
  { code: 'BW', name: 'Botswana', nameKo: '보츠와나' },
  { code: 'BR', name: 'Brazil', nameKo: '브라질' },
  { code: 'BN', name: 'Brunei', nameKo: '브루나이' },
  { code: 'BG', name: 'Bulgaria', nameKo: '불가리아' },
  { code: 'BF', name: 'Burkina Faso', nameKo: '부르키나파소' },
  { code: 'BI', name: 'Burundi', nameKo: '부룬디' },
  { code: 'CV', name: 'Cabo Verde', nameKo: '카보베르데' },
  { code: 'KH', name: 'Cambodia', nameKo: '캄보디아' },
  { code: 'CM', name: 'Cameroon', nameKo: '카메룬' },
  { code: 'CA', name: 'Canada', nameKo: '캐나다' },
  { code: 'CF', name: 'Central African Republic', nameKo: '중앙아프리카공화국' },
  { code: 'TD', name: 'Chad', nameKo: '차드' },
  { code: 'CL', name: 'Chile', nameKo: '칠레' },
  { code: 'CN', name: 'China', nameKo: '중국' },
  { code: 'CO', name: 'Colombia', nameKo: '콜롬비아' },
  { code: 'KM', name: 'Comoros', nameKo: '코모로' },
  { code: 'CG', name: 'Congo', nameKo: '콩고' },
  { code: 'CD', name: 'Congo (Democratic Republic)', nameKo: '콩고민주공화국' },
  { code: 'CR', name: 'Costa Rica', nameKo: '코스타리카' },
  { code: 'CI', name: "Côte d'Ivoire", nameKo: '코트디부아르' },
  { code: 'HR', name: 'Croatia', nameKo: '크로아티아' },
  { code: 'CU', name: 'Cuba', nameKo: '쿠바' },
  { code: 'CY', name: 'Cyprus', nameKo: '키프로스' },
  { code: 'CZ', name: 'Czechia', nameKo: '체코' },
  { code: 'DK', name: 'Denmark', nameKo: '덴마크' },
  { code: 'DJ', name: 'Djibouti', nameKo: '지부티' },
  { code: 'DM', name: 'Dominica', nameKo: '도미니카' },
  { code: 'DO', name: 'Dominican Republic', nameKo: '도미니카공화국' },
  { code: 'EC', name: 'Ecuador', nameKo: '에콰도르' },
  { code: 'EG', name: 'Egypt', nameKo: '이집트' },
  { code: 'SV', name: 'El Salvador', nameKo: '엘살바도르' },
  { code: 'GQ', name: 'Equatorial Guinea', nameKo: '적도기니' },
  { code: 'ER', name: 'Eritrea', nameKo: '에리트레아' },
  { code: 'EE', name: 'Estonia', nameKo: '에스토니아' },
  { code: 'SZ', name: 'Eswatini', nameKo: '에스와티니' },
  { code: 'ET', name: 'Ethiopia', nameKo: '에티오피아' },
  { code: 'FJ', name: 'Fiji', nameKo: '피지' },
  { code: 'FI', name: 'Finland', nameKo: '핀란드' },
  { code: 'FR', name: 'France', nameKo: '프랑스' },
  { code: 'GA', name: 'Gabon', nameKo: '가봉' },
  { code: 'GM', name: 'Gambia', nameKo: '감비아' },
  { code: 'GE', name: 'Georgia', nameKo: '조지아' },
  { code: 'DE', name: 'Germany', nameKo: '독일' },
  { code: 'GH', name: 'Ghana', nameKo: '가나' },
  { code: 'GR', name: 'Greece', nameKo: '그리스' },
  { code: 'GD', name: 'Grenada', nameKo: '그레나다' },
  { code: 'GT', name: 'Guatemala', nameKo: '과테말라' },
  { code: 'GN', name: 'Guinea', nameKo: '기니' },
  { code: 'GW', name: 'Guinea-Bissau', nameKo: '기니비사우' },
  { code: 'GY', name: 'Guyana', nameKo: '가이아나' },
  { code: 'HT', name: 'Haiti', nameKo: '아이티' },
  { code: 'HN', name: 'Honduras', nameKo: '온두라스' },
  { code: 'HU', name: 'Hungary', nameKo: '헝가리' },
  { code: 'IS', name: 'Iceland', nameKo: '아이슬란드' },
  { code: 'IN', name: 'India', nameKo: '인도' },
  { code: 'ID', name: 'Indonesia', nameKo: '인도네시아' },
  { code: 'IR', name: 'Iran', nameKo: '이란' },
  { code: 'IQ', name: 'Iraq', nameKo: '이라크' },
  { code: 'IE', name: 'Ireland', nameKo: '아일랜드' },
  { code: 'IL', name: 'Israel', nameKo: '이스라엘' },
  { code: 'IT', name: 'Italy', nameKo: '이탈리아' },
  { code: 'JM', name: 'Jamaica', nameKo: '자메이카' },
  { code: 'JP', name: 'Japan', nameKo: '일본' },
  { code: 'JO', name: 'Jordan', nameKo: '요르단' },
  { code: 'KZ', name: 'Kazakhstan', nameKo: '카자흐스탄' },
  { code: 'KE', name: 'Kenya', nameKo: '케냐' },
  { code: 'KI', name: 'Kiribati', nameKo: '키리바시' },
  { code: 'KP', name: 'North Korea', nameKo: '북한' },
  { code: 'KW', name: 'Kuwait', nameKo: '쿠웨이트' },
  { code: 'KG', name: 'Kyrgyzstan', nameKo: '키르기스스탄' },
  { code: 'LA', name: 'Laos', nameKo: '라오스' },
  { code: 'LV', name: 'Latvia', nameKo: '라트비아' },
  { code: 'LB', name: 'Lebanon', nameKo: '레바논' },
  { code: 'LS', name: 'Lesotho', nameKo: '레소토' },
  { code: 'LR', name: 'Liberia', nameKo: '라이베리아' },
  { code: 'LY', name: 'Libya', nameKo: '리비아' },
  { code: 'LI', name: 'Liechtenstein', nameKo: '리히텐슈타인' },
  { code: 'LT', name: 'Lithuania', nameKo: '리투아니아' },
  { code: 'LU', name: 'Luxembourg', nameKo: '룩셈부르크' },
  { code: 'MG', name: 'Madagascar', nameKo: '마다가스카르' },
  { code: 'MW', name: 'Malawi', nameKo: '말라위' },
  { code: 'MY', name: 'Malaysia', nameKo: '말레이시아' },
  { code: 'MV', name: 'Maldives', nameKo: '몰디브' },
  { code: 'ML', name: 'Mali', nameKo: '말리' },
  { code: 'MT', name: 'Malta', nameKo: '몰타' },
  { code: 'MH', name: 'Marshall Islands', nameKo: '마셜 제도' },
  { code: 'MR', name: 'Mauritania', nameKo: '모리타니' },
  { code: 'MU', name: 'Mauritius', nameKo: '모리셔스' },
  { code: 'MX', name: 'Mexico', nameKo: '멕시코' },
  { code: 'FM', name: 'Micronesia', nameKo: '미크로네시아' },
  { code: 'MD', name: 'Moldova', nameKo: '몰도바' },
  { code: 'MC', name: 'Monaco', nameKo: '모나코' },
  { code: 'MN', name: 'Mongolia', nameKo: '몽골' },
  { code: 'ME', name: 'Montenegro', nameKo: '몬테네그로' },
  { code: 'MA', name: 'Morocco', nameKo: '모로코' },
  { code: 'MZ', name: 'Mozambique', nameKo: '모잠비크' },
  { code: 'MM', name: 'Myanmar', nameKo: '미얀마' },
  { code: 'NA', name: 'Namibia', nameKo: '나미비아' },
  { code: 'NR', name: 'Nauru', nameKo: '나우루' },
  { code: 'NP', name: 'Nepal', nameKo: '네팔' },
  { code: 'NL', name: 'Netherlands', nameKo: '네덜란드' },
  { code: 'NZ', name: 'New Zealand', nameKo: '뉴질랜드' },
  { code: 'NI', name: 'Nicaragua', nameKo: '니카라과' },
  { code: 'NE', name: 'Niger', nameKo: '니제르' },
  { code: 'NG', name: 'Nigeria', nameKo: '나이지리아' },
  { code: 'MK', name: 'North Macedonia', nameKo: '북마케도니아' },
  { code: 'NO', name: 'Norway', nameKo: '노르웨이' },
  { code: 'OM', name: 'Oman', nameKo: '오만' },
  { code: 'PK', name: 'Pakistan', nameKo: '파키스탄' },
  { code: 'PW', name: 'Palau', nameKo: '팔라우' },
  { code: 'PA', name: 'Panama', nameKo: '파나마' },
  { code: 'PG', name: 'Papua New Guinea', nameKo: '파푸아뉴기니' },
  { code: 'PY', name: 'Paraguay', nameKo: '파라과이' },
  { code: 'PE', name: 'Peru', nameKo: '페루' },
  { code: 'PH', name: 'Philippines', nameKo: '필리핀' },
  { code: 'PL', name: 'Poland', nameKo: '폴란드' },
  { code: 'PT', name: 'Portugal', nameKo: '포르투갈' },
  { code: 'QA', name: 'Qatar', nameKo: '카타르' },
  { code: 'RO', name: 'Romania', nameKo: '루마니아' },
  { code: 'RU', name: 'Russia', nameKo: '러시아' },
  { code: 'RW', name: 'Rwanda', nameKo: '르완다' },
  { code: 'KN', name: 'Saint Kitts and Nevis', nameKo: '세인트키츠 네비스' },
  { code: 'LC', name: 'Saint Lucia', nameKo: '세인트루시아' },
  { code: 'VC', name: 'Saint Vincent and the Grenadines', nameKo: '세인트빈센트 그레나딘' },
  { code: 'WS', name: 'Samoa', nameKo: '사모아' },
  { code: 'SM', name: 'San Marino', nameKo: '산마리노' },
  { code: 'ST', name: 'Sao Tome and Principe', nameKo: '상투메 프린시페' },
  { code: 'SA', name: 'Saudi Arabia', nameKo: '사우디아라비아' },
  { code: 'SN', name: 'Senegal', nameKo: '세네갈' },
  { code: 'RS', name: 'Serbia', nameKo: '세르비아' },
  { code: 'SC', name: 'Seychelles', nameKo: '세이셸' },
  { code: 'SL', name: 'Sierra Leone', nameKo: '시에라리온' },
  { code: 'SG', name: 'Singapore', nameKo: '싱가포르' },
  { code: 'SK', name: 'Slovakia', nameKo: '슬로바키아' },
  { code: 'SI', name: 'Slovenia', nameKo: '슬로베니아' },
  { code: 'SB', name: 'Solomon Islands', nameKo: '솔로몬 제도' },
  { code: 'SO', name: 'Somalia', nameKo: '소말리아' },
  { code: 'ZA', name: 'South Africa', nameKo: '남아프리카공화국' },
  { code: 'SS', name: 'South Sudan', nameKo: '남수단' },
  { code: 'ES', name: 'Spain', nameKo: '스페인' },
  { code: 'LK', name: 'Sri Lanka', nameKo: '스리랑카' },
  { code: 'SD', name: 'Sudan', nameKo: '수단' },
  { code: 'SR', name: 'Suriname', nameKo: '수리남' },
  { code: 'SE', name: 'Sweden', nameKo: '스웨덴' },
  { code: 'CH', name: 'Switzerland', nameKo: '스위스' },
  { code: 'SY', name: 'Syria', nameKo: '시리아' },
  { code: 'TJ', name: 'Tajikistan', nameKo: '타지키스탄' },
  { code: 'TZ', name: 'Tanzania', nameKo: '탄자니아' },
  { code: 'TH', name: 'Thailand', nameKo: '태국' },
  { code: 'TL', name: 'Timor-Leste', nameKo: '동티모르' },
  { code: 'TG', name: 'Togo', nameKo: '토고' },
  { code: 'TO', name: 'Tonga', nameKo: '통가' },
  { code: 'TT', name: 'Trinidad and Tobago', nameKo: '트리니다드 토바고' },
  { code: 'TN', name: 'Tunisia', nameKo: '튀니지' },
  { code: 'TR', name: 'Turkey', nameKo: '터키' },
  { code: 'TM', name: 'Turkmenistan', nameKo: '투르크메니스탄' },
  { code: 'TV', name: 'Tuvalu', nameKo: '투발루' },
  { code: 'UG', name: 'Uganda', nameKo: '우간다' },
  { code: 'UA', name: 'Ukraine', nameKo: '우크라이나' },
  { code: 'AE', name: 'United Arab Emirates', nameKo: '아랍에미리트' },
  { code: 'GB', name: 'United Kingdom', nameKo: '영국' },
  { code: 'US', name: 'United States', nameKo: '미국' },
  { code: 'UY', name: 'Uruguay', nameKo: '우루과이' },
  { code: 'UZ', name: 'Uzbekistan', nameKo: '우즈베키스탄' },
  { code: 'VU', name: 'Vanuatu', nameKo: '바누아투' },
  { code: 'VE', name: 'Venezuela', nameKo: '베네수엘라' },
  { code: 'VN', name: 'Vietnam', nameKo: '베트남' },
  { code: 'YE', name: 'Yemen', nameKo: '예멘' },
  { code: 'ZM', name: 'Zambia', nameKo: '잠비아' },
  { code: 'ZW', name: 'Zimbabwe', nameKo: '짐바브웨' },
];

// 국가명으로 검색 (영문, 한글 모두 지원)
export function searchCountries(query: string): Country[] {
  const lowerQuery = query.toLowerCase();
  return UN_COUNTRIES.filter(
    country => 
      country.name.toLowerCase().includes(lowerQuery) ||
      country.nameKo?.includes(query)
  );
}

// 국가 코드로 국가 찾기
export function getCountryByCode(code: string): Country | undefined {
  return UN_COUNTRIES.find(country => country.code === code);
}

// 국가명으로 국가 찾기
export function getCountryByName(name: string): Country | undefined {
  return UN_COUNTRIES.find(
    country => 
      country.name.toLowerCase() === name.toLowerCase() ||
      country.nameKo === name
  );
}
```

---

## CountrySelect 컴포넌트

```typescript
// src/components/common/CountrySelect.tsx
'use client';

import { useState, useMemo } from 'react';
import { UN_COUNTRIES, Country, searchCountries } from '@/data/un-countries';

interface CountrySelectProps {
  value: string;
  onChange: (country: string) => void;
  placeholder?: string;
}

export function CountrySelect({ value, onChange, placeholder = 'Select a country' }: CountrySelectProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  const filteredCountries = useMemo(() => {
    if (!searchQuery) return UN_COUNTRIES;
    return searchCountries(searchQuery);
  }, [searchQuery]);
  
  const selectedCountry = UN_COUNTRIES.find(c => c.name === value);
  
  return (
    <div className="relative">
      <div
        className="w-full p-3 border border-gray-300 rounded-md shadow-sm cursor-pointer flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedCountry ? 'text-gray-900' : 'text-gray-400'}>
          {selectedCountry ? selectedCountry.name : placeholder}
        </span>
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b">
            <input
              type="text"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder="Search country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          {/* Country List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredCountries.map((country, index) => (
              <div
                key={country.code}
                className={`px-4 py-2 cursor-pointer hover:bg-blue-50 ${
                  country.name === value ? 'bg-blue-100' : ''
                } ${index === 0 && !searchQuery ? 'border-b-2 border-blue-200 font-semibold' : ''}`}
                onClick={() => {
                  onChange(country.name);
                  setIsOpen(false);
                  setSearchQuery('');
                }}
              >
                <span>{country.name}</span>
                {country.nameKo && (
                  <span className="ml-2 text-gray-400 text-sm">({country.nameKo})</span>
                )}
                {index === 0 && !searchQuery && (
                  <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded">우선</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 검증 정보

- **총 회원국 수**: 193개
- **데이터 출처**: UN 공식 회원국 목록
- **정렬 규칙**: South Korea 우선, 나머지 알파벳순
- **마지막 업데이트**: 2024년 기준
