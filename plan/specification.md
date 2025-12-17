																								
	課題：		授業スライドの作成に時間をかけないようにする																					
																								
	解決策：		"私たちの解決策は、ほとんどの授業に使える見やすい既存テンプレートでスライド作成を標準化することです。これにより、教員は体裁の調整にかける時間を減らし、内容に集中できます。また、授業の目標に合う最適な見せ方（レイアウト・例示・図版）を自分で選べるようになります。
Giải pháp của chúng tôi là chuẩn hóa việc tạo slide bằng các mẫu có sẵn, dễ nhìn và có thể dùng cho hầu hết các bài giảng. Nhờ đó, giảng viên giảm thời gian chỉnh sửa định dạng và tập trung vào nội dung. Đồng thời, giảng viên cũng có thể tự lựa chọn cách trình bày phù hợp với mục tiêu bài học (bố cục, ví dụ minh họa, sơ đồ/hình vẽ).
"																					
																								
	想定ユーザ：			・	ハノイ工科大学の先生 (Giảng viên Đại học Bách Khoa Hà Nội)																			
																								
																								
	Webアプリ名称：				SlideQuick（スライドクイック）																			
																								
	機能一覧																							
		No.	機能名					Mô tả chức năng							Mục đích của tính năng									
		1	"ログインと登録
Đăng nhập và đăng ký"					"ユーザーは、メールアドレスを使用して登録およびログインします。このメールアドレスは、システム内で複数のアカウントを作成するためには使用できません。パスワードはユーザーが設定し、最低8文字が必要です。新しいアカウントを登録する際には、個人または家族アカウントを選択するオプションもあります。
Người dùng đăng ký và đăng nhập bằng địa chỉ email. Một email không thể được dùng để tạo nhiều tài khoản khác nhau. Mật khẩu do người dùng đặt, phải có ít nhất 8 ký tự. Khi tạo tài khoản mới, người dùng có thể chọn loại tài khoản cá nhân hoặc gia đình."							"ユーザーが既存のアカウントでログインしたり、個人のメールアドレスを使用して新しいアカウントを作成できるようにします。
Cho phép người dùng đăng nhập bằng tài khoản hiện có hoặc tạo tài khoản mới bằng email cá nhân."									
		2	"テンプレートギャラリー／固定テーマ
Thư viện template cố định / Theme chuẩn"					"授業でよく使うレイアウトをあらかじめ5-10種類用意し、色とフォントが統一された16:9テーマと組み合わせて選ぶだけで使えます。各レイアウトには文字数の目安や画像の推奨サイズが明記され、プレビューで即確認できます。
Cung cấp sẵn 5-10 layout hay dùng  kèm theme 16:9 thống nhất màu & font; GV chỉ cần chọn để dùng ngay. Mỗi layout có gợi ý số ký tự, kích thước ảnh khuyến nghị và xem trước ngay trên trình duyệt."							"体裁を統一し、設計時間を削減する。
Chuẩn hóa trình bày, giảm thời gian thiết"									
		3	"コンテンツ入力フォーム
Form nhập nội dung"					"タイトル・学習目標・見出し・箇条書き・画像キャプションを入力、画像はドラッグ＆ドロップ。
Nhập tiêu đề, mục tiêu, đề mục, bullet, chú thích hình; ảnh kéo‑thả."							"入力を簡素化し、体裁ミスを防ぐ。
Đơn giản hóa nhập liệu, hạn chế lỗi định dạng."									
		4	"ファイル出力（PPTX／PDF）
Xuất file (PPTX/PDF)"					"PptxGenJSでPPTX、html2pdfでPDFを書き出し。
Xuất PPTX bằng PptxGenJS, PDF bằng html2pdf."							"配布・共有・印刷を容易にする。
Dễ chia sẻ, in ấn, dùng đa nền tảng."									
		5	"共有と権限（閲覧/編集）
Chia sẻ & quyền (chỉnh sửa / xem)"					"リンクを共有する際、表示専用モードと編集モードを選択できます。表示専用モードでは編集はできません。
Khi chia sẻ liên kết, bạn có thể chọn giữa chế độ chỉ xem và chế độ chỉnh sửa. Ở chế độ chỉ xem, bạn không thể chỉnh sửa."							"原稿を保護しつつ共同作業を可能に。
Bảo vệ nội dung, cộng tác an toàn."									
		6	"スライドショー（プレゼンモード）
Chế độ trình chiếu (Presentation Mode)"					"全画面表示で再生し、←／→／Spaceで移動、Escで終了。UIは自動的に非表示となり、ページ番号と進行バーを表示します。
Trình chiếu toàn màn hình; điều hướng bằng ←/→/Space, thoát bằng Esc; UI tự ẩn; hiển thị số trang và thanh tiến độ.                                                "							"授業や発表で即座に利用できる表示環境を提供し、余計な操作を減らして伝達に集中できるようにする。
Cung cấp môi trường trình bày dùng ngay trong lớp, giảm thao tác rườm rà để tập trung truyền đạt nội dung."									
		7	"レッスン別チャット
Chat theo bài"					"レッスンごとのサイドチャット。
Khung chat theo bài"							"遠隔でも迅速に意思決定できる。
Trao đổi nhanh khi làm nhóm, dù từ xa."									
		8	"スライド単位のコメント
Bình luận theo từng slide"					"各スライドに直接コメントを付与できます。返信によるスレッド化、未対応／対応済みステータス、タイムスタンプ、コメント履歴の閲覧に対応し、修正の追跡を明確にします。
Gắn bình luận trực tiếp trên từng slide. Hỗ trợ luồng hội thoại (reply), trạng thái chưa xử lý/đã xử lý, dấu thời gian và xem lịch sử nhận xét để theo dõi chỉnh sửa minh bạch."							"ピンポイントで修正指示を出せる。
Phản hồi trúng chỗ, sửa chính xác."									
																								
	画面一覧																							
		No.	画面名					画面の説明							画面の目的									
		1	"ログイン画面
(Màn hình đăng nhập )"					"ユーザーは Gmail でログインでき。

Người dùng có thể đăng nhập bằng Gmail."							"教員・学生のアカウント認証を安全かつ簡単に行えるようにする。
Đảm bảo đăng nhập an toàn và thuận tiện cho cả giảng viên và sinh viên."									
		2	"サインアップ画面
(Màn hình đăng ký)"					"ユーザーは Gmail で新規登録でき。

Người dùng có thể đăng ký bằng Gmail"							"教員・学生のアカウント作成を安全かつ簡単に行えるようにする。
Đảm bảo đăng ký tài khoản an toàn và thuận tiện cho cả giảng viên và sinh viên."									
		3	"プロジェクト一覧画面
(Màn hình danh sách dự án)"					"ユーザーが作成したすべてのプレゼンテーションをカード形式で表示。
新規作成ボタン、検索機能、各プロジェクトの操作メニューを備える。
Hiển thị tất cả các bài thuyết trình của người dùng dưới dạng thẻ. 
Có nút ""Tạo mới"", chức năng tìm kiếm và menu thao tác cho mỗi dự án."							"プレゼンテーション一覧を素早く管理できるようにする。
Giúp người dùng quản lý nhanh danh sách bài thuyết trình."									
		4	"入力フォーム画面（授業内容）
(Màn hình nhập nội dung bài giảng)"					"授業用の基本情報を入力する画面です。レッスン名、学習目標、キーワード、短い説明、主要項目のアウトラインを入力できます。「次へ／戻る」ボタンで段階的に操作できます。
Đây là màn hình để nhập thông tin cơ bản cho bài giảng. Bạn có thể nhập tên bài học, mục tiêu học tập, từ khóa, mô tả ngắn và dàn ý các mục chính.  thao tác theo từng bước bằng nút “Tiếp theo/Quay lại”.
"							"スライド作成に必要な最小限の情報を正確に収集し、後続工程に渡す。
Thu thập dữ liệu cần thiết  và chuyển sang bước tiếp theo."									
		5	"テンプレート／テーマ選択画面
(Màn hình chọn template/chủ đề)"					"テンプレート／テーマ選択画面では、授業用のスライドテンプレートとテーマのギャラリーを表示します。併設のテーマ詳細パネルには、配色・フォント・文字サイズが示され、最近使用・お気に入りの一覧と「適用」ボタンを利用できます。コントラストや可読性に関する注意喚起も表示して、見やすさを確保します。
Màn hình chọn template/chủ đề hiển thị thư viện slide mẫu và chủ đề cho bài giảng, kèm panel chi tiết theme (màu, font, cỡ chữ), mục Gần đây/Yêu thích và nút Áp dụng. đưa ra cảnh báo về độ tương phản/khả năng đọc để đảm bảo tính dễ xem.
"							"テンプレートとテーマを素早く選び、適用前に見やすさ（配色・フォント・可読性）を確認して、最適な初期レイアウトで授業資料作成を開始するための画面。
Màn hình giúp chọn nhanh template/chủ đề, kiểm tra độ dễ đọc (màu, font, khả năng đọc) trước khi áp dụng, để bắt đầu soạn bài với bố cục khởi tạo phù hợp."									
		6	"エディタ画面（詳細編集）
(Màn hình soạn thảo)"					"プレゼンテーションのタイトル・サブタイトル・画像挿入などをドラッグ＆ドロップで編集できます。右側パネルでフォントサイズ、レイアウト、配色を変更でき、「保存」ボタンを備えています。右側にはチャットエリアを表示し、スライドごとのコメント／返信（スレッド）で共同作業のやり取りを行えます。また、エクスポート、共有、プレゼンテーションボタンも用意されています。
Chỉnh sửa tiêu đề, phụ đề và chèn hình ảnh bằng thao tác kéo-thả. Bảng bên phải cho phép đổi cỡ chữ, bố cục, bảng màu và có nút “Lưu”. Bên phải hiển thị khu vực chat để cộng tác thông qua bình luận/trả lời theo từng slide (dạng luồng).Ngoài ra còn có các nút Xuất, Chia sẻ và Trình bày.
"							"教員が短時間で効率的に授業スライドを仕上げられるようにする。
Giúp giáo viên tinh chỉnh bài giảng nhanh chóng, giảm công sức."									
		7	"プレゼンテーションモード画面
 (Màn hình Trình chiếu)
"					"全画面表示：スライドのみを表示し、その他のUI要素は非表示になります。
操作：矢印キーまたはマウスクリックでスライドを切り替えます。Escキーで編集画面に戻ります。
Toàn màn hình: Chỉ hiển thị các slide và phần Presenter Notes, ẩn các thành phần UI khác.
Tương tác: Sử dụng các phím mũi tên hoặc nhấp chuột để chuyển đổi giữa các slide. Nhấn Esc để trở về màn hình chỉnh sửa."							"発表時に聴衆がコンテンツに完全に集中できるよう、不要なUI要素を排除したクリーンな表示環境を提供する
Cung cấp một môi trường hiển thị sạch sẽ, loại bỏ các yếu tố giao diện không cần thiết, giúp khán giả hoàn toàn tập trung vào nội dung khi thuyết trình."									