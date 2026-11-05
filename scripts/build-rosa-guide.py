from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, Image, KeepTogether, PageBreak, Table, TableStyle

ROOT = Path(r"D:\Project\SpaManagement\spa-management-frontend")
IMAGES = ROOT / "docs" / "images" / "rosa-huong-dan"
OUTPUT = ROOT / "docs" / "ROSA-Huong-dan-su-dung-cho-khach.pdf"

pdfmetrics.registerFont(TTFont("Arial", r"C:\Windows\Fonts\arial.ttf"))
pdfmetrics.registerFont(TTFont("Arial-Bold", r"C:\Windows\Fonts\arialbd.ttf"))
pdfmetrics.registerFontFamily("Arial", normal="Arial", bold="Arial-Bold")

ink=colors.HexColor("#123A5B"); blue=colors.HexColor("#0B6DA8"); gold=colors.HexColor("#B58B4C")
sage=colors.HexColor("#EEF5F7"); line=colors.HexColor("#D7E3EA"); muted=colors.HexColor("#587080")
S={
 "kick":ParagraphStyle("kick",fontName="Arial-Bold",fontSize=10,leading=14,textColor=gold,spaceAfter=20),
 "cover":ParagraphStyle("cover",fontName="Arial-Bold",fontSize=30,leading=38,textColor=ink,spaceAfter=18),
 "lead":ParagraphStyle("lead",fontName="Arial",fontSize=15,leading=23,textColor=muted,spaceAfter=22),
 "h1":ParagraphStyle("h1",fontName="Arial-Bold",fontSize=19,leading=25,textColor=ink,spaceBefore=16,spaceAfter=11,keepWithNext=True),
 "h2":ParagraphStyle("h2",fontName="Arial-Bold",fontSize=12.5,leading=18,textColor=blue,spaceBefore=12,spaceAfter=7,keepWithNext=True),
 "body":ParagraphStyle("body",fontName="Arial",fontSize=10.5,leading=16.5,textColor=colors.HexColor("#263740"),spaceAfter=8),
 "step":ParagraphStyle("step",fontName="Arial",fontSize=10.5,leading=16.5,textColor=colors.HexColor("#263740"),leftIndent=18,firstLineIndent=-18,spaceAfter=6),
 "caption":ParagraphStyle("caption",fontName="Arial",fontSize=9,leading=13,textColor=muted,alignment=TA_CENTER,spaceBefore=5,spaceAfter=11),
 "table":ParagraphStyle("table",fontName="Arial",fontSize=9.1,leading=13,textColor=colors.HexColor("#263740")),
}

class Doc(BaseDocTemplate):
 def __init__(self, f):
  super().__init__(str(f),pagesize=A4,leftMargin=52,rightMargin=52,topMargin=60,bottomMargin=56,title="ROSA - Hướng dẫn sử dụng",author="ROSA")
  frame=Frame(self.leftMargin,self.bottomMargin,self.width,self.height,leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0)
  self.addPageTemplates(PageTemplate(id="main",frames=frame,onPage=self.deco))
 def deco(self,c,d):
  w,h=A4;c.saveState();c.setStrokeColor(line);c.line(52,h-43,w-52,h-43);c.setFont("Arial-Bold",8);c.setFillColor(blue);c.drawString(52,h-32,"ROSA  /  HƯỚNG DẪN SỬ DỤNG");c.setFont("Arial",8);c.setFillColor(muted);c.drawRightString(w-52,h-32,"Clinic & Aesthetic");c.line(52,43,w-52,43);c.drawString(52,29,"Hướng dẫn dành cho người sử dụng ROSA");c.drawRightString(w-52,29,str(d.page));c.restoreState()

story=[]
def p(t,sty="body"): story.append(Paragraph(t,S[sty]))
def title(t,new=True):
 if new: story.append(PageBreak())
 p(t,"h1")
def sub(t): p(t,"h2")
def steps(*x):
 for i,v in enumerate(x,1): p(f"<b>{i}.</b> {v}","step")
def note(t):
 q=Table([[Paragraph(t,S["body"])]],colWidths=[491]);q.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),sage),("BOX",(0,0),(-1,-1),.6,line),("LEFTPADDING",(0,0),(-1,-1),12),("RIGHTPADDING",(0,0),(-1,-1),12),("TOPPADDING",(0,0),(-1,-1),9),("BOTTOMPADDING",(0,0),(-1,-1),6)]));story.extend([Spacer(1,3),q,Spacer(1,10)])
def shot(f,cap,h=290):
 path=IMAGES/f
 if not path.exists(): return
 iw,ih=ImageReader(str(path)).getSize();sc=min(480/iw,h/ih,1);im=Image(str(path),width=iw*sc,height=ih*sc);im.hAlign="CENTER";story.append(KeepTogether([im,Paragraph(cap,S["caption"])]))

p("TÀI LIỆU DÀNH CHO NGƯỜI MỚI","kick");p("ROSA<br/>Hướng dẫn sử dụng","cover");p("Quản lý khách hàng, lịch hẹn và vận hành spa trong một quy trình rõ ràng.","lead");p("Tài liệu hướng dẫn theo trình tự làm việc: thiết lập dữ liệu, chăm sóc khách, bán hàng và đối soát. Tên nút được in <b>đậm</b> để bạn dễ tìm trên màn hình.")
shot("01-dang-nhap.png","Màn hình đăng nhập ROSA. Dùng tài khoản cá nhân được cấp.",260)

title("Lộ trình sử dụng ROSA")
p("Thiết lập cơ sở, nhân sự và danh mục trước. Sau đó tạo khách, đặt lịch, bán hàng và theo dõi liệu trình. Làm đúng thứ tự giúp các ô chọn trong biểu mẫu đã có dữ liệu.")
rows=[("01","Tạo cơ sở, chức vụ, tài khoản và hồ sơ nhân viên","Quản lý"),("02","Tạo sản phẩm, dịch vụ hoặc gói dịch vụ","Quản lý"),("03","Tạo khách hoặc khách đặt lịch","Lễ tân / tư vấn"),("04","Bán hàng, theo dõi thẻ và ghi nhận buổi làm","Theo quyền"),("05","Đối soát kho, công nợ, công ca và báo cáo","Quản lý")]
t=Table([[Paragraph(a,S['table']),Paragraph(b,S['table']),Paragraph(c,S['table'])] for a,b,c in rows],colWidths=[38,320,133]);t.setStyle(TableStyle([("ROWBACKGROUNDS",(0,0),(-1,-1),[sage,colors.white]),("LINEBELOW",(0,0),(-1,-1),.4,line),("VALIGN",(0,0),(-1,-1),"TOP"),("LEFTPADDING",(0,0),(-1,-1),8),("RIGHTPADDING",(0,0),(-1,-1),8),("TOPPADDING",(0,0),(-1,-1),8),("BOTTOMPADDING",(0,0),(-1,-1),8)]));story.append(t)
sub("Màn hình Tổng quan")
p("Sau khi đăng nhập, chọn đúng cơ sở và xem Tổng quan để nắm doanh thu, tiền thực thu, tổng chi và dòng tiền trong kỳ. Chọn <b>Xem báo cáo</b> khi cần mở chi tiết.")
shot("02-tong-quan.png","Tổng quan ROSA hiển thị nhanh tình hình vận hành của spa.",285)

title("1. Thiết lập cơ sở và nhân sự")
sub("Tạo cơ sở")
steps("Vào <b>Chi nhánh</b> → <b>Tạo mới</b>.","Nhập tên, địa chỉ và thông tin cần dùng của cơ sở rồi bấm <b>Lưu thay đổi</b>.","Kiểm tra tên cơ sở xuất hiện trong danh sách trước khi tạo nhân viên hoặc giao dịch.")
shot("03-chi-nhanh-modal.png","Biểu mẫu tạo cơ sở.",210)
sub("Tạo chức vụ, tài khoản và hồ sơ nhân sự")
steps("Tạo <b>Chức vụ</b> trước, ví dụ kỹ thuật viên hoặc tư vấn viên.","Vào <b>Tài khoản</b> → <b>Tạo mới</b>, chọn quyền và cơ sở được phép làm việc.","Vào <b>Hồ sơ nhân sự</b> → <b>Tạo mới</b>, chọn chức vụ và cơ sở cho từng người.")
shot("04-chuc-vu-modal.png","Chức vụ là dữ liệu cần có trước khi tạo hồ sơ nhân sự.",185)
shot("06-nhan-su-danh-sach.png","Danh sách hồ sơ nhân sự dùng để phân công và tính công.",250)
note("Tài khoản đăng nhập và hồ sơ nhân sự là hai phần khác nhau: tài khoản dùng để vào hệ thống; hồ sơ dùng để ghi nhận người thực hiện dịch vụ.")

title("2. Tạo sản phẩm, dịch vụ và gói nhiều hạng mục")
p("Vào <b>Sản phẩm & dịch vụ</b> → <b>Tạo mới</b>. Chọn đúng loại: sản phẩm để quản lý tồn kho, dịch vụ để bán chăm sóc, hoặc gói khi spa cần theo dõi nhiều hạng mục.")
steps("Nhập tên, giá bán và đơn vị. Với sản phẩm, khai báo tồn ban đầu theo từng cơ sở.","Với dịch vụ liệu trình, nhập số buổi và cấu hình công theo chức vụ nếu áp dụng.","Với gói nhiều bước, thêm các <b>dịch vụ con</b>, sắp xếp thứ tự và xác định số buổi riêng cho từng hạng mục.","Bấm <b>Lưu thay đổi</b>, mở lại danh mục để kiểm tra.")
shot("07-san-pham-dich-vu-danh-sach.png","Danh sách sản phẩm và dịch vụ của ROSA.",270)
shot("07-dich-vu-modal-dich-vu-con.png","Gói dịch vụ có thể chứa các dịch vụ con để theo dõi tiến độ riêng.",230)
note("Thay đổi cấu hình gói sau khi bán không tự thay đổi các thẻ đã tạo cho khách trước đó. Hãy thống nhất cấu trúc gói trước khi mở bán.")

title("3. Khách hàng: hồ sơ, buổi thực hiện và chữ ký")
steps("Vào <b>Khách hàng</b> → tìm tên hoặc số điện thoại trước khi tạo mới.","Ví dụ, chọn <b>Bùi Thị Xuyên</b> để mở hồ sơ khách và kiểm tra lịch sử trước khi tư vấn hoặc bán thêm.","Trong hồ sơ, xem phần mua hàng, liệu trình, số buổi còn lại, ví, công nợ và thông tin chăm sóc; cập nhật hồ sơ khi có thông tin mới.")
shot("08-khach-hang-danh-sach.png","Danh sách có khách Bùi Thị Xuyên và khách huy hon đang còn nợ 40.000 đồng.",270)
shot("08-ho-so-khach-hang.png","Màn hình chi tiết của một hồ sơ đã có liệu trình: có nút Xem lịch sử, Thực hiện và Ký kết thúc liệu trình.",270)
sub("Thực hiện buổi ngay trong hồ sơ khách")
steps("Ở thẻ dịch vụ/nhóm liệu trình còn buổi, bấm <b>Thực hiện</b>.","Chọn đúng cơ sở, ngày thực hiện và nhân viên. Kiểm tra lại đúng hạng mục khi gói có nhiều dịch vụ con.","Nhập ghi chú buổi làm: tình trạng, vùng chăm sóc, phản hồi của khách hoặc dặn dò lần sau. Ghi chú phải ngắn gọn và phục vụ việc chăm sóc tiếp theo.","Chọn <b>Chữ ký</b> khi spa cần khách xác nhận, mời khách ký trong khung và bấm xác nhận để lưu cùng buổi thực hiện.")
sub("Xem lịch sử và ký kết thúc liệu trình")
p("Bấm <b>Xem lịch sử</b> để đọc từng buổi: ngày, nhân viên, ghi chú và chữ ký đã lưu. Khi toàn bộ liệu trình kết thúc, bấm <b>Ký kết thúc liệu trình</b>, nhập ghi chú hoàn tất nếu cần và mời khách ký xác nhận riêng. Chữ ký buổi và chữ ký kết thúc là hai xác nhận khác nhau.")
sub("Album ảnh da")
p("Trong hồ sơ khách, mở <b>Album ảnh da</b> → <b>Thêm lần chụp</b>. Nhập ngày chụp, ghi chú ngắn như “trước điều trị”, rồi đính kèm ảnh liên quan. Mỗi lần chụp có thể chứa nhiều ảnh để tiện so sánh khi khách quay lại.")
shot("08-tai-anh-da-khach.png","Album ảnh da được lưu theo từng khách và từng lần chụp.",260)
note("Chỉ lưu ảnh phục vụ hồ sơ chăm sóc và thực hiện theo quy trình đồng ý của khách. Không dùng ghi chú ảnh để lưu thông tin nhạy cảm không cần thiết.")

title("4. Khách đặt lịch và lịch hẹn")
sub("Khách đặt lịch")
p("Dùng <b>Khách đặt lịch</b> khi cần theo dõi khách hẹn đến, kể cả người chưa có hồ sơ khách hàng chính thức.")
steps("Vào <b>Khách đặt lịch</b> → <b>Tạo lịch đặt</b>.","Chọn khách cũ hoặc nhập thông tin khách mới, sau đó nhập ngày, giờ, cơ sở, dịch vụ quan tâm, ưu đãi và ghi chú.","Lọc danh sách theo ngày, cơ sở, khách, dịch vụ hoặc trạng thái để lễ tân chuẩn bị đón khách.")
shot("09-khach-dat-lich-danh-sach.png","Danh sách khách đặt lịch hỗ trợ lọc và xem lịch theo ngày.",275)
shot("09-khach-dat-lich-modal.png","Biểu mẫu đặt lịch cho khách mới hoặc khách đã có hồ sơ.",250)
note("Theo dõi trạng thái <b>Đã đến</b> và <b>Chưa đến</b> để lễ tân biết khách nào cần liên hệ lại hoặc chuẩn bị tiếp đón.")
sub("Lịch hẹn và nhật ký liên hệ")
steps("Vào <b>Lịch hẹn</b> → <b>Tạo lịch hẹn</b>, chọn khách, cơ sở, ngày và ghi chú.","Mở lịch cần chăm sóc, thêm <b>Lần liên hệ</b> để ghi nội dung gọi điện hoặc nhắn tin.","Xem lại lịch sử liên hệ để ca trực sau tiếp tục chăm sóc khách.")
shot("10-lich-hen-ghi-chu-lien-he.png","Lần liên hệ được lưu riêng với ghi chú dịch vụ của lịch hẹn.",240)

title("5. Cấu hình gói và lập hóa đơn")
sub("Cấu hình dịch vụ có dịch vụ con")
steps("Vào <b>Sản phẩm & dịch vụ</b>, tạo hoặc sửa dịch vụ cha rồi thêm các dịch vụ con trong đúng thứ tự spa thực hiện.","Với từng dịch vụ con, chọn số buổi theo chính sách gói. Chọn <b>Trọn đời</b> khi không giới hạn số lần; nếu hạng mục chưa áp dụng thẻ, đặt <b>Số buổi = 0</b>.","Lưu cấu hình và mở lại để kiểm tra. Cấu hình này quyết định các hạng mục thẻ được tạo khi khách mua gói.")
shot("07-dich-vu-modal-dich-vu-con.png","Mỗi dịch vụ con trong gói được cấu hình số buổi riêng.",245)
sub("Lập hóa đơn và cấu hình lần làm ngay")
steps("Vào <b>Bán hàng</b> → <b>Tạo hóa đơn</b>, tìm <b>Bùi Thị Xuyên</b> hoặc khách cần bán và chọn cơ sở.","Bấm <b>Thêm sản phẩm / dịch vụ</b>, chọn gói hoặc dịch vụ; kiểm tra giá, số lượng, giảm giá và nhân viên tư vấn.","Với dịch vụ làm ngay, thiết lập <b>lần làm</b> ngay trên dòng hóa đơn: chọn hạng mục dịch vụ con, nhân viên thực hiện, ghi chú và chữ ký nếu cần. Nếu khách chỉ mua để dùng sau, không đánh dấu lần làm.","Kiểm tra tổng tiền, khách trả, công nợ và phương thức thanh toán rồi bấm <b>Lưu hóa đơn</b>. Sau khi lưu, kiểm tra thẻ liệu trình và lịch sử để chắc chắn không ghi trùng.")
shot("11-tao-hoa-don.png","Biểu mẫu tạo hóa đơn: chọn khách, cơ sở và dịch vụ/gói cần bán.",275)
shot("15-hoa-don-chi-tiet-dong.png","Dòng dịch vụ dùng để kiểm tra giá, giảm giá và cấu hình lần làm ngay.",265)
note("Chỉ bấm lưu một lần và đợi thông báo thành công. Khi đã lưu, tìm lại hóa đơn trong danh sách trước khi thao tác tiếp để tránh tạo trùng.")

title("6. Liệu trình: thực hiện, lịch sử và hai loại chữ ký")
p("Khi bán một gói có nhiều dịch vụ con, ROSA tạo nhóm thẻ để spa theo dõi từng hạng mục riêng. Trong mỗi nhóm, chọn đúng hạng mục khách vừa làm.")
steps("Vào <b>Liệu trình</b>, tìm khách rồi mở nhóm hoặc thẻ cần thực hiện.","Kiểm tra số buổi còn lại của đúng hạng mục, bấm <b>Thực hiện</b> và chọn nhân viên.","Nhập ghi chú buổi làm. Nếu đã lấy chữ ký trong lần làm ngay trên hóa đơn, kiểm tra thông tin đó trong lịch sử; nếu chưa có, dùng nút <b>Ghi chú / Ký</b> để mời khách ký.","Bấm <b>Xem lịch sử</b> để kiểm tra ngày, nhân viên, ghi chú và trạng thái chữ ký từng buổi.","Chỉ bấm <b>Ký kết thúc liệu trình</b> khi spa xác nhận hoàn tất cả liệu trình. Đây là chữ ký hoàn tất riêng, không thay thế chữ ký của từng buổi.")
shot("12-lieu-trinh-danh-sach.png","Danh sách liệu trình giúp tìm nhanh khách và nhóm thẻ.",275)
shot("12-chi-tiet-lieu-trinh.png","Chi tiết liệu trình hiển thị hạng mục, số buổi và lịch sử thực hiện.",275)
note("Chữ ký của buổi thực hiện và chữ ký hoàn tất liệu trình là hai loại xác nhận khác nhau. Chỉ dùng theo quy trình đã thống nhất của spa.")

title("7. Khách hàng hôm nay và xem ngày trước")
p("Ở <b>Tổng quan</b>, khu vực <b>Khách hàng hôm nay</b> giúp xem khách đã làm dịch vụ trong ngày, hạng mục đã thực hiện, nhân viên và trạng thái chữ ký. ROSA cũng cho phép xem lại danh sách của những ngày đã qua.")
steps("Mở <b>Tổng quan</b> và cuộn đến bảng <b>Khách hàng hôm nay</b>.","Dùng nút <b>Ngày trước</b> hoặc chọn trực tiếp ô <b>Ngày xem</b> để chuyển sang ngày cần kiểm tra. Tiêu đề đổi thành “Khách hàng ngày ...” để xác nhận bạn đang xem dữ liệu quá khứ.","Mở dòng khách để xem buổi, nhấn <b>Ghi chú / Ký</b> nếu cần bổ sung ghi chú hoặc chữ ký theo quyền; kiểm tra nhân viên trước khi gán lại.","Bấm <b>Hôm nay</b> để quay về dữ liệu hiện tại.")
shot("02-tong-quan.png","Từ Tổng quan, cuộn đến bảng Khách hàng hôm nay để xem, chọn ngày trước hoặc quay lại hôm nay.",275)
note("Bảng dùng ngày xem, vì vậy có thể rà lại khách của các ngày trước mà không cần thay đổi chứng từ. Chỉ chỉnh hoặc hoàn tác khi đã đối chiếu đúng khách, ngày và hạng mục.")

title("8. Kho, ví, công nợ và phiếu chi")
sub("Kho")
steps("Vào <b>Nhập kho</b> → <b>Tạo phiếu nhập</b>, chọn cơ sở, thêm sản phẩm, số lượng và giá nhập.","Mở <b>Tồn kho</b>, chọn đúng cơ sở để đối chiếu số lượng sau khi lưu phiếu.")
shot("13-nhap-kho.png","Danh sách phiếu nhập kho.",245)
shot("13-ton-kho.png","Tồn kho cần được đối chiếu theo từng cơ sở.",240)
sub("Ví khách hàng")
steps("Vào <b>Ví khách hàng</b> → <b>Nạp ví</b>, chọn khách và cơ sở.","Nhập tiền khách nạp, tiền thưởng nếu có, phương thức và ghi chú; kiểm tra số dư sau khi lưu.")
shot("14-vi-khach-hang.png","Ví khách hàng và lịch sử giao dịch.",235)
sub("Thu công nợ cho huy hon")
steps("Trong <b>Khách hàng</b>, khách <b>huy hon</b> đang còn nợ 40.000 đồng. Vào <b>Thu công nợ</b> → <b>Tạo phiếu thu</b>.","Chọn huy hon, chọn hóa đơn còn nợ hoặc loại nợ cũ đúng với khoản cần thu, nhập số tiền thu và phương thức thanh toán.","Lưu phiếu rồi mở lại công nợ của khách để đối chiếu số còn lại.")
shot("14-thu-cong-no.png","Danh sách thu công nợ dùng để đối chiếu phần khách đã thanh toán.",235)
sub("Phiếu chi")
steps("Vào <b>Phiếu chi</b> → <b>Tạo phiếu chi</b>, chọn cơ sở và ngày chi.","Thêm từng khoản chi, ghi nội dung và số tiền, kiểm tra tổng rồi lưu.")
shot("15-phieu-chi.png","Danh sách phiếu chi phát sinh trong ngày.",235)

title("9. Công ca, báo cáo và xuất Excel")
sub("Công ca")
p("Vào <b>Công ca</b>, chọn khoảng ngày để xem các lượt thực hiện đã gán nhân viên và tổng công. Mở chi tiết theo nhân viên hoặc xuất Excel khi cần đối soát.")
shot("16-cong-ca.png","Màn hình công ca nhân viên.",265)
sub("Báo cáo kinh doanh")
steps("Vào <b>Báo cáo</b>, chọn từ ngày, đến ngày và cơ sở cần xem.","Đọc doanh thu, tiền thực thu, chi phí, dòng tiền và mở các thẻ chứng từ để kiểm tra.","Bấm <b>Xuất Excel</b> sau khi đã chọn đúng kỳ và cơ sở; kiểm tra file trước khi chia sẻ.")
shot("16-bao-cao.png","Báo cáo kinh doanh có chỉ số tổng hợp và các bảng chứng từ.",275)
note("Doanh thu là giá trị bán hàng, có thể chưa thu đủ. Tiền thực thu và dòng tiền cần được xem cùng phiếu chi, thu nợ, ví và chứng từ liên quan trước khi đối soát.")

title("10. Một ngày làm việc với ROSA")
sub("Đầu ngày")
p("Đăng nhập → chọn cơ sở → xem Tổng quan, khách đặt lịch, lịch hẹn và các khách cần chăm sóc.")
sub("Khi đón khách")
p("Tìm hoặc tạo khách → kiểm tra hồ sơ và lịch sử → lập hóa đơn khi phát sinh → thực hiện đúng hạng mục liệu trình → ghi chú hoặc xác nhận nếu spa áp dụng.")
sub("Cuối ngày")
p("Đối chiếu hóa đơn, thu nợ, ví, kho, chi phí, công ca và báo cáo. Xuất Excel khi cần tổng hợp nội bộ.")

title("11. Khi cần hỗ trợ")
rows=[("Không thấy menu","Kiểm tra quyền tài khoản và cơ sở được gán."),("Danh sách trống","Kiểm tra từ khóa, khoảng ngày và cơ sở đang chọn."),("Không lưu được","Xem thông báo trên biểu mẫu; kiểm tra các trường bắt buộc."),("Dữ liệu không khớp","Đối chiếu khách, cơ sở, ngày và chứng từ trước khi sửa."),("Không kết nối được","Kiểm tra mạng, chờ tải lại và không bấm lưu nhiều lần.")]
t=Table([[Paragraph(a,S['table']),Paragraph(b,S['table'])] for a,b in rows],colWidths=[145,346]);t.setStyle(TableStyle([("ROWBACKGROUNDS",(0,0),(-1,-1),[sage,colors.white]),("LINEBELOW",(0,0),(-1,-1),.4,line),("VALIGN",(0,0),(-1,-1),"TOP"),("LEFTPADDING",(0,0),(-1,-1),9),("RIGHTPADDING",(0,0),(-1,-1),9),("TOPPADDING",(0,0),(-1,-1),9),("BOTTOMPADDING",(0,0),(-1,-1),9)]));story.append(t)
p("Khi liên hệ hỗ trợ, gửi tên màn hình, thời điểm, các bước vừa thực hiện và thông báo lỗi. Không gửi mật khẩu đăng nhập.")

Doc(OUTPUT).build(story)
print(OUTPUT)
