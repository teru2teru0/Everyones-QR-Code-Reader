document.getElementById('captureBtn').addEventListener('click', async () => {
  // 初期化
  document.getElementById("qrError").innerText = '';
  const captureBtn = document.getElementById("captureBtn");
  const baseCaptureBtnValue = captureBtn.textContent;
  captureBtn.disabled = true
  captureBtn.textContent = "読み取り中..."
  await new Promise(resolve => setTimeout(resolve, 400)); // 連続スクリーンショットができないので400msの遅延を入れる
  try {
    // メッセージを送信して 現在表示されているスクリーンショットを取得
    const result = await chrome.runtime.sendMessage({ action: 'capture' });
    if (result.screenshotUrl) {
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.src = result.screenshotUrl;
        img.onload = () => {
          const canvas = document.getElementById('canvas');
          const context = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
          canvas.width = img.width;
          canvas.height = img.height;
          context.drawImage(img, 0, 0);

          // QRコードを読み取る部分の選択とデコード
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height); // 適切な座標とサイズに変更
          const code = jsQR(imageData.data, canvas.width, canvas.height);
          if (code) {
            const text_decoder = new TextDecoder('shift-jis');
            const decodeData = text_decoder.decode(Uint8Array.from(code.binaryData).buffer);
            document.getElementById('result').value = decodeData;
          } else {
            document.getElementById("qrError").innerText = 'QRコードが見つかりませんでした';
          }
          resolve();
        };

        img.onerror = (err) => {
          document.getElementById("qrError").innerText = `${err}\n画像が読み込めませんでした。`;
          console.error('Image load error:', err);
        }
      });
    } else {
      document.getElementById("qrError").innerText = 'スクリーンショットを取得できませんでした';
    }
  } catch (error) {
    document.getElementById("qrError").innerText = `${error}\n不明なエラー。`;
    console.error('Error:', error);
  } finally {
    captureBtn.textContent = baseCaptureBtnValue
    captureBtn.disabled = false
  }
});

document.getElementById('copyBtn').addEventListener('click', () => {
  const resultText = document.getElementById('result').value;
  if (resultText) {
    navigator.clipboard.writeText(resultText).then(() => {
      window.alert(`${resultText}\nをコピーしました。`);
    }).catch(err => {
      document.getElementById('qrError').innerText = 'コピーに失敗しました。';
      console.error('Copy failed:', err);
    });
  } else {
    window.alert('コピーするテキストがありません');
  }
});