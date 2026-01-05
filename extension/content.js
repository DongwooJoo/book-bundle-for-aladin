/**
 * 알라딘 장바구니 페이지 Content Script
 * 페이지 로드 시 자동으로 실행됩니다.
 */

// 페이지가 알라딘 장바구니인지 확인
if (window.location.href.includes('aladin.co.kr/shop/wbasket.aspx')) {
  console.log('[북번들] 알라딘 장바구니 페이지 감지됨');
  
  // 확장 프로그램이 설치되어 있음을 표시하는 데이터 속성 추가
  document.body.setAttribute('data-bookbundle-extension', 'installed');
}

/**
 * 장바구니에서 책 정보 추출
 * popup.js에서 chrome.scripting.executeScript로 호출됩니다.
 */
function extractCartItems() {
  const items = [];
  
  // 모든 장바구니 체크박스 선택
  const checkboxes = document.querySelectorAll('input.ShopCode_Basket_Check.basket_CheckBox');
  
  checkboxes.forEach(checkbox => {
    const row = checkbox.closest('tr[id^="CartTr_"]');
    if (!row) return;
    
    const itemId = checkbox.getAttribute('itemid');
    if (!itemId) return;
    
    const price = parseInt(checkbox.getAttribute('pricesales')) || 0;
    const qty = parseInt(checkbox.getAttribute('qty')) || 1;
    
    // 제목 + 등급 추출
    const titleLink = row.querySelector('span.basket_tit a');
    const fullTitle = titleLink?.textContent?.trim() || '';
    
    // [중고-상], [중고-최상], [중고-중] 패턴에서 등급 추출
    const qualityMatch = fullTitle.match(/\[중고-([^\]]+)\]/);
    const quality = qualityMatch ? qualityMatch[1] : '상';
    const title = fullTitle.replace(/\[중고-[^\]]+\]\s*/, '').trim();
    
    // 표지 이미지
    const coverImg = row.querySelector('img[src*="aladin.co.kr/product"]');
    let cover = coverImg?.getAttribute('src') || '';
    
    // covermini를 coversum으로 변경 (더 큰 이미지)
    if (cover) {
      cover = cover.replace('covermini', 'coversum');
    }
    
    items.push({
      itemId: parseInt(itemId),
      title,
      quality,       // 최상, 상, 중
      price,
      qty,
      cover,
      minQuality: quality, // BookItem 인터페이스와 호환
      productUrl: `https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${itemId}`
    });
  });
  
  return items;
}

// 전역으로 노출 (혹시 필요할 경우)
window.extractCartItems = extractCartItems;

