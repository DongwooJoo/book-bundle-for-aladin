// 북번들 웹앱 URL
const BOOKBUNDLE_URL = 'http://localhost:5173';

// DOM 요소
const statusEl = document.getElementById('status');
const statusIconEl = statusEl.querySelector('.status-icon');
const statusTextEl = statusEl.querySelector('.status-text');
const bookListEl = document.getElementById('book-list');
const booksEl = document.getElementById('books');
const bookCountEl = document.getElementById('book-count-number');
const extractBtn = document.getElementById('extract-btn');
const sendBtn = document.getElementById('send-btn');

// 추출된 책 데이터
let extractedBooks = [];

// 초기화
document.addEventListener('DOMContentLoaded', async () => {
  await checkCurrentPage();
});

// 현재 페이지 확인
async function checkCurrentPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab.url && tab.url.includes('aladin.co.kr/shop/wbasket.aspx')) {
      setStatus('success', '✅', '알라딘 장바구니 페이지입니다');
      extractBtn.disabled = false;
    } else if (tab.url && tab.url.includes('aladin.co.kr')) {
      setStatus('warning', '⚠️', '장바구니 페이지로 이동해주세요');
      extractBtn.disabled = true;
    } else {
      setStatus('error', '❌', '알라딘 사이트가 아닙니다');
      extractBtn.disabled = true;
    }
  } catch (error) {
    console.error('페이지 확인 오류:', error);
    setStatus('error', '❌', '페이지를 확인할 수 없습니다');
  }
}

// 상태 표시 업데이트
function setStatus(type, icon, text) {
  statusEl.className = `status ${type}`;
  statusIconEl.textContent = icon;
  statusTextEl.textContent = text;
}

// 추출 버튼 클릭
extractBtn.addEventListener('click', async () => {
  try {
    extractBtn.disabled = true;
    setStatus('', '⏳', '책 정보를 추출하는 중...');

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Content script 실행
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractCartItems
    });

    if (results && results[0] && results[0].result) {
      extractedBooks = results[0].result;
      
      if (extractedBooks.length > 0) {
        displayBooks(extractedBooks);
        setStatus('success', '✅', `${extractedBooks.length}권의 책을 찾았습니다`);
        sendBtn.style.display = 'block';
        extractBtn.style.display = 'none';
      } else {
        setStatus('warning', '📭', '장바구니가 비어있습니다');
        extractBtn.disabled = false;
      }
    } else {
      setStatus('error', '❌', '책 정보를 추출할 수 없습니다');
      extractBtn.disabled = false;
    }
  } catch (error) {
    console.error('추출 오류:', error);
    setStatus('error', '❌', '추출 중 오류가 발생했습니다');
    extractBtn.disabled = false;
  }
});

// 책 목록 표시
function displayBooks(books) {
  bookCountEl.textContent = books.length;
  booksEl.innerHTML = '';

  books.forEach(book => {
    const li = document.createElement('li');
    
    const qualityClass = book.quality === '최상' ? 'best' : 
                         book.quality === '상' ? 'good' : 'fair';
    
    li.innerHTML = `
      <img src="${book.cover || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 44"><rect fill="%23e2e8f0" width="32" height="44"/><text x="16" y="24" text-anchor="middle" fill="%2394a3b8" font-size="8">📚</text></svg>'}" 
           alt="${book.title}" 
           onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 44%22><rect fill=%22%23e2e8f0%22 width=%2232%22 height=%2244%22/></svg>'">
      <div class="book-info">
        <div class="book-title" title="${book.title}">${book.title}</div>
        <div class="book-meta">${book.price ? book.price.toLocaleString() + '원' : ''}</div>
      </div>
      <span class="book-quality ${qualityClass}">${book.quality}</span>
    `;
    
    booksEl.appendChild(li);
  });

  bookListEl.style.display = 'block';
}

// 북번들로 전송 버튼 클릭
sendBtn.addEventListener('click', async () => {
  try {
    sendBtn.disabled = true;
    setStatus('', '🚀', '북번들로 전송 중...');

    // 데이터를 Base64로 인코딩하여 URL 해시로 전달 (가장 안정적)
    const encodedData = btoa(encodeURIComponent(JSON.stringify(extractedBooks)));
    
    // 북번들 웹앱 열기 (해시에 데이터 포함)
    await chrome.tabs.create({ 
      url: `${BOOKBUNDLE_URL}?from=extension#data=${encodedData}` 
    });

    setStatus('success', '✅', '전송 완료! 북번들 탭을 확인하세요');
    
    // 1.5초 후 팝업 닫기
    setTimeout(() => {
      window.close();
    }, 1500);

  } catch (error) {
    console.error('전송 오류:', error);
    setStatus('error', '❌', '전송 중 오류가 발생했습니다');
    sendBtn.disabled = false;
  }
});

// 장바구니에서 책 정보 추출 (Content Script로 실행됨)
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

