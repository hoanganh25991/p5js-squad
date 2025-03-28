document.querySelectorAll(".key").forEach((key) => {
  // Lắng nghe sự kiện chuột
  key.addEventListener("mousedown", (event) => {
    const keyValue = event.target.getAttribute("data-key");
    if (keyValue) {
      triggerKeyEvent(keyValue, "keydown");
    }
  });

  key.addEventListener("mouseup", (event) => {
    const keyValue = event.target.getAttribute("data-key");
    if (keyValue) {
      triggerKeyEvent(keyValue, "keyup");
    }
  });

  // Lắng nghe sự kiện cảm ứng
  key.addEventListener("touchstart", (event) => {
    event.preventDefault(); // Ngăn chặn sự kiện mặc định để tránh nhấp nháy
    const keyValue = event.target.getAttribute("data-key");
    if (keyValue) {
      triggerKeyEvent(keyValue, "keydown");
    }
  });

  key.addEventListener("touchend", (event) => {
    event.preventDefault();
    const keyValue = event.target.getAttribute("data-key");
    if (keyValue) {
      triggerKeyEvent(keyValue, "keyup");
    }
  });
});

function triggerKeyEvent(keyValue, eventType) {
  const keyCodeMap = {
    arrowUp: 38,
    arrowDown: 40,
    arrowLeft: 37,
    arrowRight: 39,
    a: 65,
    s: 83,
    d: 68,
    f: 70,
    q: 81,
    w: 87,
    e: 69,
    r: 82,
  };

  const event = new KeyboardEvent(eventType, {
    key: keyValue,
    code: keyValue.startsWith("Arrow")
      ? keyValue
      : `Key${keyValue.toUpperCase()}`,
    keyCode: keyCodeMap[keyValue],
    which: keyCodeMap[keyValue],
    bubbles: true,
  });
  document.dispatchEvent(event);
}
