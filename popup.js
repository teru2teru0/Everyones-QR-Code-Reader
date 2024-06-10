document.getElementById('captureBtn').addEventListener('click', async () => {
  // 初期化
  const errorElement = document.getElementById("qrError");
  errorElement.innerText = '';
  const captureBtn = document.getElementById("captureBtn");
  const baseCaptureBtnValue = captureBtn.textContent;
  captureBtn.disabled = true;
  captureBtn.textContent = "読み取り中...";

  await new Promise(resolve => setTimeout(resolve, 400)); // 連続スクリーンショットができないので400msの遅延を入れる

  try {
    // メッセージを送信して現在表示されているスクリーンショットを取得
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
            // バイナリーデータを保存
            const binaryData = new Uint8Array(code.binaryData);
            const base64String = btoa(String.fromCharCode.apply(null, binaryData));
            document.getElementById('qrCodeBase64BinaryData').value = base64String;

            updateEncodedData();
          } else {
            errorElement.innerText = 'QRコードが見つかりませんでした';
          }
          resolve();
        };

        img.onerror = (err) => {
          errorElement.innerText = `画像が読み込めませんでした。エラー: ${err}`;
          console.error('Image load error:', err);
        };
      });
    } else {
      errorElement.innerText = 'スクリーンショットを取得できませんでした';
    }
  } catch (error) {
    errorElement.innerText = `不明なエラー: ${error}`;
    console.error('Error:', error);
  } finally {
    captureBtn.textContent = baseCaptureBtnValue;
    captureBtn.disabled = false;
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

// 取得したURLを新規タブで表示
document.getElementById("createTabButton").addEventListener("click", async () => {
    const resultText = document.getElementById("result").value;

    if (!resultText) {
      window.alert("QRコードが読み取られていません。");
      return;
    }

    try {
      const currentTab = await new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs.length > 0) {
            resolve(tabs[0]);
          } else {
            reject(new Error("現在のタブを取得できませんでした。"));
          }
        });
      });
      chrome.tabs.create({ url: resultText, index: currentTab.index + 1 });
    } catch (err) {
      console.error("Error :", err);
      window.alert("新しいタブを開けませんでした。もう一度お試しください。");
    }
  });

// ラジオボタンの選択変更イベントリッスン
document.querySelectorAll('input[name="encoding"]').forEach((radio) => {
  radio.addEventListener('change', updateEncodedData);
});

// エンコードデータを更新して表示
function updateEncodedData() {
  const base64String = document.getElementById('qrCodeBase64BinaryData').value;
  if (!base64String) {
    document.getElementById('qrError').innerText = 'QRコードデータが見つかりませんでした。';
    return;
  }
  const qrCodeBinaryData = Uint8Array.from(atob(base64String), c => c.charCodeAt(0));
  const encoding = document.querySelector('input[name="encoding"]:checked').value;
  let textDecoder;

  if (encoding === 'utf-8') {
    textDecoder = new TextDecoder('utf-8');
  } else if (encoding === 'shift-jis') {
    textDecoder = new TextDecoder('shift-jis');
  }

  const decodedData = textDecoder.decode(qrCodeBinaryData.buffer);
  document.getElementById('result').value = decodedData;
}
