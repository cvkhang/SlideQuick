プロダクトバックログ																
																
	No	機能	権限	詳細（機能の説明）											優先順位	ステータス
	1	登録                           Đăng ký	"ユーザー
Người dùng"	"新規アカウントを作成するため、ユーザーは登録画面で必須情報を入力し、「登録」ボタンをクリックします。
必須フィールド： ユーザー名、メールアドレス、パスワード、および役割（教員/学生）。
メール形式の検証： @記号を含むこと、および@記号の後にドメイン名が含まれることを確認します。
パスワードの強度： パスワードが以下のうち少なくとも2種類を含むことを検証します：英字（大文字/小文字）、数字、および記号。
役割： 必ず一つの役割を選択する必要があります。選択されていない場合、エラーメッセージが表示されます。
登録成功： データベースに保存し、ログイン画面に遷移し、確認メールを送信します。
メールアドレスの重複： エラーを報告します。
Để tạo tài khoản mới, người dùng nhập thông tin bắt buộc trên màn hình đăng ký và nhấp vào nút ""Đăng ký"".
- Các trường bắt buộc: Tên người dùng, email, mật khẩu và vai trò (giáo viên/học sinh)
- Xác thực định dạng email: Bao gồm ký hiệu @ và đảm bảo tên miền được bao gồm sau ký hiệu @.
- Độ mạnh của mật khẩu: Xác thực rằng mật khẩu chứa ít nhất hai trong số các ký tự sau: chữ hoa/chữ thường, số và ký hiệu.
- Phải chọn một vai trò. Nếu không chọn, thông báo lỗi sẽ hiển thị.
- Đăng ký thành công: Lưu vào cơ sở dữ liệu, tiếp tục đến màn hình đăng nhập và gửi email xác nhận.
- Email trùng lặp sẽ báo lỗi."											5	保留中
	2	ログイン機能              Đăng nhập	"ユーザー
Người dùng"	"ユーザーはメールアドレス/ユーザー名とパスワードを入力し、「ログイン」をクリックします。
メールアドレスのチェック： 登録されていないメールアドレスの場合は、「メールアドレスまたはパスワードが正しくありません」という同一の通知を表示します。
パスワード： データベース内のパスワードと比較されます。
成功： ホームページのURLが返され、ユーザーは（そこへ）リダイレクトされます。
失敗： ロックポリシーを適用する場合があります（例：5回のログイン失敗後に一時的にロックする）。

Người dùng nhập địa chỉ email/tên người dùng và mật khẩu, sau đó nhấp vào ""Đăng nhập"".
- Kiểm tra định dạng email: Email chưa đăng ký sẽ hiển thị cùng một thông báo ""Địa chỉ email hoặc mật khẩu không đúng"".
- Mật khẩu được so sánh với mật khẩu trong cơ sở dữ liệu.
- Thành công: URL trang chủ được trả về và người dùng được chuyển tiếp.
- Thất bại: Có thể áp dụng chính sách khóa (ví dụ: khóa tạm thời sau năm lần đăng nhập không thành công).
"											5	保留中
	3	"ログアウト
Đăng xuất"	"ユーザー
Người dùng"	"ログインしているユーザーは、システムから安全にログアウトできることが望まれます。ユーザーは「ログアウト」ボタンをクリックします。このボタンは通常、アカウントメニュー内、またはインターフェース上の目立つ場所にあります。するとシステムから警告が表示され、ユーザーは再度クリックしてログアウトを確認する必要があります。ログアウトに成功すると、ユーザーはログインページにリダイレクトされます。これは、デバイスが使用されなくなった際に、ユーザーのアカウントを不正アクセスから保護するためのものです。
Với tư cách là người dùng đã đăng nhập, có mong muốn có thể đăng xuất khỏi hệ thống một cách an toàn. người dùng sẽ nhấp vào nút ""Đăng xuất"", thường nằm trong menu tài khoản hoặc ở vị trí dễ thấy trên giao diện. Sau đố hệ thống sẽ hiện lên cảnh cáo, người dùng phải bấm xác nhận một lần nữa để đăng xuất thành công. Sau khi đăng xuất thành công, người dùng sẽ được chuyển hướng trở lại trang đăng nhập. Mục tiêu là để bảo vệ tài khoản của người dùng khỏi bị truy cập trái phép khi không còn sử dụng thiết bị.
"											5	保留中
	4	Quên mật khẩu	"ユーザー
Người dùng"	"""ユーザーはログイン画面の「パスワードを忘れた」リンクをクリックします。
1) 申請：登録メールアドレスまたはユーザー名を入力し。
2) 通知：入力情報が有効なら、再設定用リンクをメールへ送信します。
3) 期限：リンクは例えば15分間有効。
4) 再設定：新しいパスワードを入力し、強度ポリシーを満たす必要があります。確認のため同じパスワードを再入力。
5) 成功：保存後、すべての既存セッションを無効化し、ログイン画面へリダイレクト。完了通知メールを送付。
6) 失敗：期限切れ・トークン不正時はエラーを表示し、やり直し手順を案内。
Người dùng nhấp vào liên kết ""Quên mật khẩu"" trên màn hình đăng nhập.
1) Yêu cầu: Nhập địa chỉ email hoặc tên người dùng đã đăng ký của bạn.
2) Thông báo: Nếu thông tin nhập vào hợp lệ, một liên kết đặt lại mật khẩu sẽ được gửi đến email của bạn.
3) Hết hạn: Liên kết có hiệu lực trong, ví dụ: 15 phút.
4) Đặt lại: Nhập mật khẩu mới phải đáp ứng chính sách về độ mạnh. Nhập lại cùng mật khẩu để xác nhận.
5) Thành công: Sau khi lưu, tất cả các phiên hiện có sẽ bị vô hiệu hóa và người dùng được chuyển hướng đến màn hình đăng nhập. Một email thông báo hoàn tất sẽ được gửi.
6) Thất bại: Nếu mật khẩu đã hết hạn hoặc không hợp lệ, một lỗi sẽ được hiển thị và hướng dẫn cách thử lại sẽ được cung cấp."											5	保留中
	5	"プロジェクト一覧
Danh sách dự án"	"ユーザー
Người dùng"	"作成されたすべての講義/スライド、そして共有されたすべての講義/スライドを管理するための一元的なインターフェースをユーザーに提供します。
ユーザーは、わずか数ステップの操作で、プロジェクトの表示、検索、整理、開く、編集、共有、削除、新規作成を行うことができます。
目標は、ユーザーが教材を効果的かつ直感的に管理し、時間を節約できるようにすることです。
Cung cấp cho người dùng một giao diện trung tâm để quản lý tất cả bài giảng / slide đã tạo và cả bài giảng / slide được chia sẻ 
Người dùng có thể xem, tìm kiếm, sắp xếp, mở, chỉnh sửa, chia sẻ, xóa hoặc tạo dự án mới chỉ với vài thao tác.
Mục tiêu là giúp người dùng quản lý tài nguyên giảng dạy hiệu quả, trực quan, và tiết kiệm thời gian."											1	保留中
	6	"プロジェクト作成・削除
Tạo/xóa dự án"	"ユーザー
Người dùng"	"新しい講義を作成できるようにする方法：
- プロジェクト名を入力する。
作成後、システムはプロジェクト一覧に自動的に保存し、コンテンツ入力画面およびテンプレート選択画面を開きます。
使用しなくなったプロジェクトは、講義一覧を整理して管理しやすくし、重複を避けるために削除できるようにします：
- 削除方法：ゴミ箱へ移動（期限付き）または完全に削除。
- 削除前に権限を確認し、再確認のダイアログを表示する。
目的：ユーザーが自分の講義リポジトリを能動的に管理できるようにし、管理操作を最適化するとともに、削除時のデータ安全性を確保すること。
Cho phép tạo một bài giảng mới bằng cách: Nhập tên dự án
Sau khi tạo, hệ thống tự động lưu vào danh sách dự án. Và mở màn hình nhập nội dung và chọn template.
Xóa dự án không còn sử dụng nhằm giữ cho danh sách bài giảng gọn gàng, dễ quản lý, tránh trùng lặp:
- Xóa: chuyển thùng rác (có thời hạn) hoặc xóa vĩnh viễn
- Xác nhận quyền và hỏi lại trước khi xóa.
Mục tiêu là giúp người dùng chủ động kiểm soát kho bài giảng của mình, tối ưu hóa thao tác quản lý, đồng thời đảm bảo an toàn dữ liệu khi xóa."											2	保留中
	7	"テンプレート/テーマ標準ライブラリ
Thư viện template/theme chuẩn"	"ユーザー
Người dùng"	"「テンプレート／テーマ標準ライブラリ」機能は、ユーザーが授業用のテンプレートを簡単に検索、フィルタ、プレビューし、プロジェクトに適用できるようにするものです。
ユーザーは「すべて／教育／ビジネス／シンプル」などのカテゴリを切り替え、テンプレート名やキーワードで素早く検索することができます。
また、ユーザーはテンプレートを色、フォント、レイアウトで絞り込み、最近使用したテンプレートを確認することもできます。
「★」ボタンを押すことで、お気に入りのテンプレートを保存し、後で再利用することができます。
テンプレートを選択すると、詳細情報とプレビューを確認でき、「適用」ボタンを押して現在のプロジェクトに反映させることができます。
さらに、ユーザーはお気に入りのテーマを今後の授業のデフォルトとして設定でき、読み込みエラーが発生した場合は「再試行」ボタンとスケルトンUIが表示され、スムーズで直感的な操作が可能になります。
Chức năng “Thư viện template / theme chuẩn” cho phép người dùng dễ dàng tìm kiếm, lọc, xem trước và áp dụng template cho bài giảng của mình.
Người dùng có thể chuyển đổi giữa các danh mục như “Tất cả / Giáo dục / ... / Đơn giản”, và tìm kiếm nhanh theo tên hoặc từ khóa.
Ngoài ra, người dùng có thể lọc template theo màu sắc, font chữ và bố cục, cũng như xem lại các template đã sử dụng gần đây.
Người dùng có thể lưu những mẫu yêu thích bằng cách nhấn “*”, để thuận tiện sử dụng lại sau này.
Khi chọn một template, người dùng có thể xem thông tin chi tiết và bản xem trước, đồng thời nhấn “Áp dụng” để sử dụng cho dự án hiện tại.
Ngoài ra, người dùng có thể đặt theme yêu thích làm mặc định cho các bài giảng sau này, và khi xảy ra lỗi tải, hệ thống sẽ hiển thị nút “Thử lại” cùng giao diện tải tạm (skeleton UI) để thao tác luôn mượt mà và trực quan."											2	保留中
	8	"コンテンツ入力フォーム
Form nhập nội dung"	"ユーザー
Người dùng"	"「コンテンツ入力フォーム」機能により、ユーザーはタイトル、学習目標、トピック、箇条書き、画像注釈などの主要スライド要素を、直感的なフォームインターフェースを通じて迅速に入力できる。
・画像をアップロード領域に直接ドラッグ＆ドロップしてスライドに挿入可能。複雑な操作は不要。
・システムは選択されたテーマに基づき、フォント、サイズ、配置などのテキスト形式を自動的に標準化し、一貫性を確保し、レイアウトエラーを回避する。
・入力内容は自動保存され、スライドエディタ画面に即時反映される。
・必須項目（タイトル・本文など）が未入力の場合はエラーメッセージを表示する。
・頻繁に使用されるセクションや表現は自動提案され、入力補完をサポートする。
・ユーザーは入力済みコンテンツをテンプレートとして保存し、次回以降再利用できる。
Tính năng “Biểu mẫu nhập nội dung slide” cho phép người dùng nhập nhanh các thành phần chính của slide như tiêu đề, mục tiêu học tập, đề mục, danh sách bullet và chú thích hình ảnh qua giao diện trực quan. 
Người dùng có thể kéo – thả hình ảnh vào vùng tải lên để chèn vào slide mà không cần thao tác phức tạp. "											3	保留中
	9	"エディタ
Soạn thảo"	"ユーザー
Người dùng"	"メイン画面は三つの領域に分かれています。左側はスライド一覧で、スライドの追加・削除・複製が可能です。中央は編集エリアで、ユーザーはブロックのドラッグ＆ドロップや属性（色、フォント、内容）の変更を行います。右側にはプロパティパネルとチャットがあり、スライドの詳細を調整したりやり取りを行えます。編集エリアでのすべての変更は自動保存（デバウンス）をトリガーし、最後の変更から5秒後に保存リクエストが送信されます。保存時にエラーが発生した場合は、画面上部に赤い固定表示で「保存できません」という状態メッセージが表示され、ユーザーに通知します。
Giao diện chính được chia thành ba phần: bảng slide ở bên trái cho phép thêm, xóa, sao chép slide; vùng soạn thảo ở giữa nơi người dùng kéo-thả khối và thay đổi thuộc tính (màu, font, nội dung); bảng thuộc tính và khung chat ở bên phải để điều chỉnh chi tiết slide và trao đổi. Mọi thay đổi trong vùng soạn thảo sẽ kích hoạt cơ chế lưu tự động (debounce): sau 5 giây kể từ lần thay đổi cuối cùng hệ thống sẽ gửi yêu cầu lưu. Nếu thao tác lưu gặp lỗi, một thông báo trạng thái màu đỏ ""Không thể lưu"" sẽ hiển thị cố định ở góc trên để báo cho người dùng. "											1	保留中
	10	"ファイルエクスポート
Xuất file (PPTX/PDF)"	"ユーザー
Người dùng"	"ユーザーが「Export（エクスポート）」ボタンをクリックし、希望する出力形式（PPTXまたはPDF）を選択します。

システムは処理プロセスを開始し、進捗バー（progress bar）と完了パーセンテージを表示します。特に50スライドを超える講義の場合は、これが表示されます。

エクスポート処理が完了した後、ファイルは自動的にユーザーのブラウザにダウンロードされます。

規則：出力ファイルのフォーマット、レイアウト、およびフォントは、編集画面上のオリジナルと100％一致する必要があります。
Người dùng nhấp vào nút ""Xuất"" và chọn định dạng đầu ra mong muốn (PPTX hoặc PDF).

Hệ thống sẽ bắt đầu xử lý và hiển thị thanh tiến trình cùng tỷ lệ phần trăm hoàn thành, đặc biệt đối với các bài giảng có hơn 50 slide.

Sau khi quá trình xuất hoàn tất, tệp sẽ tự động tải xuống trình duyệt của người dùng.

Quy định: Định dạng, bố cục và phông chữ của tệp đầu ra phải trùng khớp 100% với tệp gốc trên màn hình chỉnh sửa."											3	保留中
	11	"共有と権限（編集・閲覧）
Chia sẻ & quyền (chỉnh sửa / xem)"	ユーザーNgười dùng	"ユーザーは、自分のプレゼンテーションを他の人と共有し、対応するアクセス権限を設定するためにこの機能を使用します。
まず、ユーザーは共有するプレゼンテーションを選択し、次に「共有」ボタンを押して権限設定インターフェースを開きます。
ここには、「閲覧可能なリンク」と「編集可能なリンク」の2つのリンクが表示されます。ユーザーは特定の権限を持つ共有リンクを選択し、リンクをコピーして共有相手に送信します。
Người dùng sẽ sử dụng chức năng này để chia sẻ bài thuyết trình của mình với người khác và thiết lập quyền truy cập tương ứng.
Trước hết, người dùng sẽ chọn bài thuyết trình cần chia sẻ, sau đó nhấn nút “Chia sẻ” để mở giao diện cài đặt quyền.
Tại đây, hiện 2 đường link “Liên kết có thể xem” và ""Liên kết có thể chỉnh sửa"", người dùng chọn liên kết chia sẻ với quyền hạn cụ thể ấn vào copy đường link rồi gửi cho người được chia sẻ"											3	保留中
	12	"プレゼンテーション
Chế độ trình chiếu (Presentation Mode)"	"ユーザー
Người dùng"	"ユーザーは、スライドの内容を明確かつ専門的に表示するため、全画面（フルスクリーン）モードでプレゼンテーションを行う際にこの機能を使用します。
プレゼンテーションモードを有効にすると、システムは各スライドを全画面で表示し、編集用のツールバーやメニューを非表示にし、「次へ」、「戻る」、「プレゼンテーションを終了」といった基本的な操作ボタンのみを保持（表示）します。
ユーザーは、矢印キー、マウス、またはリモートコントロール（リモコン）を使用してスライド間を移動できます。
終了する際、ユーザーはESCキーを押すか、「プレゼンテーションを終了」を選択するだけで、通常の編集インターフェースに戻ることができます。
Người dùng sẽ sử dụng chức năng này để trình bày bài thuyết trình ở chế độ toàn màn hình, giúp hiển thị nội dung slide một cách rõ ràng và chuyên nghiệp.
Khi kích hoạt chế độ trình chiếu, hệ thống sẽ hiển thị từng slide ở chế độ toàn màn hình, ẩn các thanh công cụ và menu chỉnh sửa, chỉ giữ lại các nút điều khiển cơ bản như chuyển tiếp, quay lại và thoát trình chiếu.
Người dùng có thể di chuyển giữa các slide bằng phím mũi tên, chuột, hoặc điều khiển từ xa.
Khi kết thúc, người dùng chỉ cần nhấn phím ESC hoặc chọn “Thoát trình chiếu” để quay lại giao diện chỉnh sửa thông thường."											2	保留中
	13	"講義別チャット
Chat theo bài"	"ユーザー
Người dùng"	"チャット機能は、エディター画面の右側にある「プロパティ/チャット」パネルに統合されています。各講義には個別のチャットチャンネルがあります。ユーザーはテキストボックスにメッセージを入力し、Enterキーまたは「送信」ボタンを押します。システムはメッセージ履歴全体を保存する必要があります。ルール：新しいメッセージがあると、ユーザーがクリックして表示するまで、「チャット」タブに通知アイコンが表示されます。
Chức năng Chat được tích hợp trong Bảng thuộc tính/Chat ở phía bên phải màn hình soạn thảo. Mỗi bài giảng có một kênh chat riêng biệt. Người dùng nhập tin nhắn vào ô văn bản và nhấn Enter hoặc nút ""Gửi"". Hệ thống phải lưu lại toàn bộ lịch sử tin nhắn. Quy tắc: Khi có tin nhắn mới, một biểu tượng thông báo sẽ xuất hiện trên tab Chat cho đến khi người dùng nhấp vào để xem."											4	保留中