@. giúp tôi update lại game tank này game squad
- tank.js là file chính của logic, viết logic 3d trong p5js
- keyboard.js là file tôi nghe các phím layout trên màn hình
- status-board.js cũng là 1 layout ở trên dom html
- p5js share state vào window, để dom ở ngoài đọc được

bây h là logic của squad
- squad ban đầu chỉ có 1 lính
- squad đang đi trên 1 cây cầu
- squad chỉ di chuyển ngang
- squad auto bắn về phím trước để giết quân địch
- quân địch di chuyển trên cầu, tiến tới tấn công squad
- bên phải cầu, có 1 đường luồng có các vật phẩm nâng cấp

vật phẩm nâng cấp:
- 1. "gương +1", gương trôi tới phía trước trên cầu, squad đụng vào gương thì thêm được 1 soldier vào squad
- 2. "súng", thêm súng, bắn đạn nhanh hơn, súng xịn hơn, to hơn
- 3. "súng x", thêm loại súng khác, mạnh hơn nữa
- 4. "súng y", thêm loại súng khác, mạnh hơn nữa
- 5. lúc nào cũng là mạnh hơn, thêm đạn, thêm tốc độ,...

quân địch:
- có nhiều loại khác nhau
- đi trước là lính thường
- lâu lâu xuất hiện boss 1, boss 2, boss 3,...
- boss 3 > 2 > 1