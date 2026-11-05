from pathlib import Path
import zipfile, shutil, re
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.section import WD_SECTION
from docx.enum.style import WD_STYLE_TYPE
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from PIL import Image, ImageDraw, ImageFont

SRC=Path(r'D:\Project\SpaManagement\Doc\hướng dẫn sử dụng.docx')
OUT=Path(r'D:\Project\SpaManagement\Doc\Hướng dẫn sử dụng ROSA.docx')
TMP=Path(r'D:\Project\SpaManagement\tmp\rosa-word-assets'); TMP.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(SRC) as z:
 for n in z.namelist():
  if n.startswith('word/media/'):
   (TMP/Path(n).name).write_bytes(z.read(n))
# Chỉ dùng đúng các ảnh gốc trích từ Word. Những ảnh cắt phục vụ trình bày được tạo bên dưới không được phép làm lệch chỉ số ảnh.
imgs=sorted((p for p in TMP.glob('image*.png') if re.fullmatch(r'image\d+\.png',p.name)),key=lambda x:int(x.stem[5:]))

doc=Document(); sec=doc.sections[0]; sec.top_margin=Inches(.7);sec.bottom_margin=Inches(.65);sec.left_margin=Inches(.75);sec.right_margin=Inches(.75)
styles=doc.styles
for n,size,bold,color in [('Title',27,True,'123A5B'),('Heading 1',19,True,'123A5B'),('Heading 2',13.5,True,'0B6DA8'),('Normal',10.5,False,'263740')]:
 s=styles[n];s.font.name='Aptos';s.font.size=Pt(size);s.font.bold=bold;s.font.color.rgb=RGBColor.from_string(color);s.paragraph_format.space_after=Pt(8);s.paragraph_format.line_spacing=1.32
styles['Heading 1'].paragraph_format.space_before=Pt(18);styles['Heading 1'].paragraph_format.keep_with_next=True
styles['Heading 2'].paragraph_format.space_before=Pt(13);styles['Heading 2'].paragraph_format.space_after=Pt(8);styles['Heading 2'].paragraph_format.keep_with_next=True
def shade(cell,fill):
 tcPr=cell._tc.get_or_add_tcPr(); shd=OxmlElement('w:shd');shd.set(qn('w:fill'),fill);tcPr.append(shd)
def white_text(cell):
 for p in cell.paragraphs:
  for r in p.runs:
   r.font.color.rgb=RGBColor(255,255,255);r.font.bold=True
def set_cell_margins(cell,top=110,start=130,bottom=110,end=130):
 tc=cell._tc;tcPr=tc.get_or_add_tcPr();tcMar=tcPr.first_child_found_in('w:tcMar')
 if tcMar is None: tcMar=OxmlElement('w:tcMar');tcPr.append(tcMar)
 for side,value in [('top',top),('start',start),('bottom',bottom),('end',end)]:
  node=tcMar.find(qn(f'w:{side}'))
  if node is None: node=OxmlElement(f'w:{side}');tcMar.append(node)
  node.set(qn('w:w'),str(value));node.set(qn('w:type'),'dxa')
def set_cell_border(cell,color='C7D4E0'):
 tcPr=cell._tc.get_or_add_tcPr();borders=tcPr.first_child_found_in('w:tcBorders')
 if borders is None: borders=OxmlElement('w:tcBorders');tcPr.append(borders)
 for edge in ('top','left','bottom','right','insideH','insideV'):
  tag=qn(f'w:{edge}');node=borders.find(tag)
  if node is None: node=OxmlElement(f'w:{edge}');borders.append(node)
  node.set(qn('w:val'),'single');node.set(qn('w:sz'),'5');node.set(qn('w:color'),color)
def polish_table(table):
 for row_index,row in enumerate(table.rows):
  for cell in row.cells:
   cell.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
   set_cell_margins(cell)
   set_cell_border(cell)
   for p in cell.paragraphs:
    p.paragraph_format.space_before=Pt(0);p.paragraph_format.space_after=Pt(0);p.paragraph_format.line_spacing=1.15
   if row_index>0 and row_index%2==0: shade(cell,'EEF5FA')
 for cell in table.rows[0].cells:
  shade(cell,'1F4E78');white_text(cell)
def add_page_num(p):
 r=p.add_run(' | ');fld=OxmlElement('w:fldSimple');fld.set(qn('w:instr'),'PAGE');r._r.addnext(fld)
header=sec.header.paragraphs[0];header.text='ROSA  |  HƯỚNG DẪN SỬ DỤNG';header.style='Normal';header.runs[0].font.bold=True;header.runs[0].font.color.rgb=RGBColor(0,0,0)
footer=sec.footer.paragraphs[0];footer.alignment=WD_ALIGN_PARAGRAPH.RIGHT;footer.add_run('Tài liệu dành cho khách hàng');add_page_num(footer)
def title(t): doc.add_heading(t,0 if t.startswith('Hướng') else 1)
def h(t): doc.add_heading(t,1)
def h2(t): doc.add_heading(t,2)
def para(t,boldlead=None):
 p=doc.add_paragraph();
 if boldlead and t.startswith(boldlead): p.add_run(boldlead).bold=True;p.add_run(t[len(boldlead):])
 else:p.add_run(t)
def steps(items):
 for n,x in enumerate(items,1):
  p=doc.add_paragraph();p.paragraph_format.left_indent=Inches(.23);p.paragraph_format.first_line_indent=Inches(-.23)
  p.paragraph_format.space_after=Pt(6);p.paragraph_format.line_spacing=1.28;p.paragraph_format.keep_with_next=True;p.paragraph_format.keep_together=True
  p.add_run(f'{n}. ').bold=True
  p.add_run(re.sub(r'</?b>','',x))
def pic(i,caption):
 mapping={1:[1],2:[2,4,5],3:[3],4:[6],5:[7,8],6:[9],7:[10,11],8:[12,13],9:[14],10:[15],11:[16,17],12:[18,19],13:[20,21],14:[22],15:[23,24,25,26],16:[27,28],17:[29,30],18:[32],19:[31],20:[33],21:[34],22:[35],23:[36],24:[37],25:[38],26:[39,40]}
 for actual in mapping.get(i,[i]):
  insert_pic(actual,caption)
def insert_pic(i,caption):
 captions={2:'Tạo và quản lý tài khoản.',3:'Thiết lập chức vụ.',4:'Danh sách hồ sơ nhân sự.',5:'Biểu mẫu thêm nhân viên mới.',7:'Thiết lập dịch vụ.',8:'Cấu hình mức công theo chức vụ.',11:'Lịch sử chăm sóc của từng dịch vụ.',16:'Danh sách lịch hẹn.',17:'Thêm ghi chú liên hệ cho lịch hẹn.',18:'Lịch sử hóa đơn.',19:'Tạo hóa đơn.',20:'Cấu hình số buổi dịch vụ con và thanh toán.',21:'Sửa và xóa hóa đơn.',23:'Lịch sử thực hiện liệu trình.',24:'Thực hiện một buổi liệu trình.',25:'Lấy chữ ký khách hàng.',26:'Ký kết thúc liệu trình.',27:'Tổng quan doanh thu.',28:'Khách hàng hôm nay và lịch sử ngày trước.',29:'Khách cần quan tâm và khách chưa đến.',30:'Ghi chú quản lý lịch hẹn.',31:'Tồn kho theo cơ sở.',32:'Nhập kho.',33:'Ví khách hàng.',34:'Thu công nợ.',35:'Phiếu chi.',36:'Công ca nhân viên.',37:'Doanh số tư vấn và hoa hồng.',38:'Báo cáo tổng quan và dữ liệu theo ngày.',39:'Doanh thu sản phẩm và dịch vụ.',40:'Chi tiết chứng từ.'}
 if i<=len(imgs):
  source=imgs[i-1]
  # Chỉ hiển thị ngăn chi tiết hóa đơn của Bùi Thị Xuyên, tránh đưa danh sách khách không liên quan vào tài liệu.
  if i==18:
   source=TMP/'image18-detail-bui-thi-xuyen.png'
   with Image.open(imgs[i-1]) as original:
    original.crop((930,0,1920,1000)).save(source)
  if i==21:
   source=TMP/'image21-edit-delete-bui-thi-xuyen.png'
   with Image.open(imgs[i-1]) as original:
    revised=original.copy()
    draw=ImageDraw.Draw(revised)
    draw.rectangle((800,218,940,268),fill='white')
    font=ImageFont.truetype(r'C:\Windows\Fonts\arialbd.ttf',16)
    draw.text((815,233),'Bùi Thị Xuyên',fill=(23,50,77),font=font)
    revised.save(source)
  p=doc.add_paragraph();p.alignment=WD_ALIGN_PARAGRAPH.CENTER;p.paragraph_format.keep_with_next=True;p.paragraph_format.keep_together=True;p.add_run().add_picture(str(source),width=Inches(5.75))
  c=doc.add_paragraph(caption);c.alignment=WD_ALIGN_PARAGRAPH.CENTER;c.paragraph_format.keep_together=True;c.runs[0].italic=True;c.runs[0].font.size=Pt(9);c.runs[0].font.color.rgb=RGBColor(92,108,119)
def note(t): para('Lưu ý: '+t,'Lưu ý: ')
def page(): doc.add_page_break()
def tbl(rows):
 t=doc.add_table(rows=1,cols=2);t.style='Table Grid';t.rows[0].cells[0].text='Mốc';t.rows[0].cells[1].text='Công việc'
 for c in t.rows[0].cells: shade(c,'1F4E78');white_text(c)
 for a,b in rows:
  c=t.add_row().cells;c[0].text=a;c[1].text=b
 polish_table(t)

title('Hướng dẫn sử dụng ROSA');para('Tài liệu hướng dẫn dành cho quản lý, lễ tân, tư vấn và kỹ thuật viên sử dụng ROSA trong công việc hằng ngày. Làm theo trình tự từ thiết lập dữ liệu đến chăm sóc khách, bán hàng và đối soát để hạn chế sai sót.');h2('Lộ trình sử dụng');
roadmap=doc.add_table(rows=1,cols=2);roadmap.style='Table Grid';roadmap.rows[0].cells[0].text='Bước';roadmap.rows[0].cells[1].text='Việc cần làm';
for c in roadmap.rows[0].cells:shade(c,'1F4E78');white_text(c)
for a,b in [('1','Tạo cơ sở, chức vụ, tài khoản và nhân viên.'),('2','Tạo sản phẩm, dịch vụ, gói và cấu hình mức công.'),('3','Quản lý khách, lịch đặt, lịch hẹn và chăm sóc.'),('4','Lập hóa đơn, theo dõi liệu trình và thu tiền.'),('5','Đối chiếu kho, ví, công nợ, chi phí, công ca và báo cáo.')]:
 cells=roadmap.add_row().cells;cells[0].text=a;cells[1].text=b
polish_table(roadmap)

page();h('1. Cơ sở và nhân sự')
h2('1.1 Tạo cơ sở')
steps(['Vào <b>Chi nhánh</b> → <b>Thêm mới</b>.','Nhập tên cơ sở, địa chỉ và thông tin liên hệ.','Bấm <b>Lưu thay đổi</b>, sau đó kiểm tra cơ sở xuất hiện trong danh sách và trong ô chọn cơ sở ở đầu trang.'])
insert_pic(1,'Tạo cơ sở mới.')
h2('1.2 Tạo chức vụ')
steps(['Vào <b>Chức vụ</b> → <b>Thêm mới</b>.','Nhập tên chức vụ, ví dụ tư vấn, kỹ thuật viên hoặc quản lý.','Lưu lại trước khi tạo nhân viên để chức vụ này có thể được chọn trong hồ sơ nhân sự.'])
insert_pic(3,'Tạo chức vụ trước khi tạo nhân viên.')
h2('1.3 Tạo tài khoản')
steps(['Vào <b>Tài khoản</b> → <b>Thêm mới</b>.','Nhập tên đăng nhập, họ tên, mật khẩu, quyền và chi nhánh được làm việc.','Lưu lại rồi kiểm tra tài khoản xuất hiện trong danh sách.'])
insert_pic(2,'Tạo tài khoản đăng nhập và phân quyền.')
h2('1.4 Tạo hồ sơ nhân sự')
steps(['Vào <b>Hồ sơ nhân sự</b> để kiểm tra danh sách nhân viên hiện có.','Bấm <b>Thêm mới</b>, nhập họ tên, số điện thoại và chọn chức vụ đã tạo ở bước 1.2.','Chọn chi nhánh làm việc, lưu hồ sơ và kiểm tra tên nhân viên xuất hiện trong danh sách.'])
insert_pic(4,'Danh sách hồ sơ nhân sự.')
insert_pic(5,'Biểu mẫu thêm nhân viên mới.')
note('Tài khoản dùng để đăng nhập. Hồ sơ nhân sự dùng để phân công thực hiện và tính công ca.')

page();h('2. Sản phẩm, dịch vụ và cấu hình công')
h2('2.1 Tạo sản phẩm')
steps(['Vào <b>Sản phẩm & dịch vụ</b> → <b>Thêm mới</b>, chọn <b>Phân loại = Sản phẩm</b>.','Nhập tên, giá niêm yết, giá bán và đơn vị.','Nhập tồn kho ban đầu theo từng cơ sở nếu đây là số hàng hiện có lúc bắt đầu dùng ROSA. Sau đó dùng <b>Nhập kho</b> cho các lần tăng tồn tiếp theo.'])
insert_pic(6,'Tạo sản phẩm, giá bán, đơn vị và tồn kho ban đầu.')
h2('2.2 Tạo dịch vụ liệu trình')
steps(['Vào <b>Sản phẩm & dịch vụ</b> → <b>Thêm mới</b>, đổi <b>Phân loại = Dịch vụ</b>, sau đó nhập tên, giá bán và các thông tin riêng của dịch vụ.','Bật <b>Là liệu trình</b> khi khách mua một lần với số lượng nhiều nhưng cần quay lại thực hiện qua nhiều buổi. Ví dụ khách mua liệu trình triệt lông 5 buổi hoặc chăm sóc da 10 buổi: ROSA cần tạo thẻ để theo dõi từng buổi khách đã làm và số buổi còn lại.','Tắt <b>Là liệu trình</b> khi khách mua số lượng nhiều nhưng được làm trọn trong một buổi. Ví dụ tẩy nhiều nốt ruồi hoặc bắn nhiều nốt mụn thịt trong cùng một lần làm: ghi số lượng trên hóa đơn, không cần tạo thẻ liệu trình và lịch sử buổi riêng.','Đặt <b>Số buổi tạo tự động khi mua liệu trình</b> đúng với số buổi khách đã mua. Ví dụ liệu trình triệt lông 5 buổi đặt là 5; liệu trình chăm sóc da 10 buổi đặt là 10. Khi lưu hóa đơn, ROSA sẽ tạo sẵn đúng số buổi này để nhân viên thực hiện lần lượt.','Nhập <b>Ngày tới lần hẹn kế tiếp</b> nếu spa muốn ROSA gợi ý lịch hẹn sau buổi hiện tại. Kiểm tra lại cấu hình trước khi lưu vì thay đổi sau khi khách đã mua sẽ không tự sửa các thẻ liệu trình đã phát sinh.'])
insert_pic(7,'Tạo dịch vụ liệu trình và cấu hình dịch vụ con.')
h2('2.3 Cấu hình dịch vụ con')
steps(['Trong khung <b>Dịch vụ con</b>, bấm <b>Thêm dịch vụ con</b> và chọn từng hạng mục thuộc gói.','Sắp xếp thứ tự bằng nút mũi tên: thứ tự này cũng là thứ tự hiển thị cho người dùng khi theo dõi liệu trình.','Ví dụ gói chữa nám có thể gồm pnp, laser nám, tan nhang và các dịch vụ khác. Bỏ một dòng chỉ gỡ dịch vụ ra khỏi gói, không xóa dịch vụ gốc.'])
insert_pic(7,'Khung Dịch vụ con và thứ tự thực hiện trong gói.')
h2('2.4 Cấu hình mức công theo chức vụ')
steps(['Trong phần <b>Tính công theo chức vụ</b>, tick đúng chức vụ được hưởng công, ví dụ KTV hoặc bác sĩ.','Mỗi <b>Mức công</b> áp dụng cho một khoảng giá: nhập giá từ, giá đến và cách tính là phần trăm hoặc số tiền.','Khi có nhiều bậc giá, giá đến của bậc trước phải bằng giá từ của bậc sau. Bậc cuối để trống giá đến khi áp dụng không giới hạn.','Kiểm tra lại mức công trước khi lưu vì dữ liệu này được dùng khi tính công ca.'])
insert_pic(8,'Cấu hình nhiều mức công theo khoảng giá và chức vụ.')

page();h('3. Khách hàng và hồ sơ chăm sóc')
h2('3.1 Hồ sơ và lịch sử mua');steps(['Vào <b>Khách hàng</b>, tìm theo tên hoặc số điện thoại rồi mở đúng hồ sơ. Luôn đối chiếu số điện thoại trước khi tư vấn hoặc tạo giao dịch để tránh thao tác nhầm khách trùng tên.','Trong hồ sơ, kiểm tra lịch sử mua, thẻ liệu trình, số buổi đã dùng/còn lại, số dư ví và công nợ. Đây là căn cứ để tư vấn dịch vụ tiếp theo hoặc thu khoản còn thiếu.']);insert_pic(9,'Hồ sơ khách hàng và lịch sử mua.')
h2('3.2 Sửa hồ sơ và theo dõi ảnh da');steps(['Bấm <b>Sửa</b> để cập nhật thông tin liên hệ khi khách thay đổi. Kiểm tra lại dữ liệu trước khi lưu vì số điện thoại được dùng để tìm nhanh hồ sơ sau này.','Trong <b>Album ảnh da</b>, thêm lần chụp, chọn đúng ngày chụp, viết ghi chú về tình trạng da và tải ảnh lên. Mỗi lần chụp nên có ghi chú ngắn để nhân viên khác hiểu được diễn biến trước khi khách quay lại.','Mở lại danh sách lần chụp để đối chiếu ngày, ghi chú và ảnh đã lưu.']);insert_pic(10,'Sửa hồ sơ và Album ảnh da.')
h2('3.3 Xem lịch sử chăm sóc');steps(['Trong từng dịch vụ đã mua, bấm <b>Xem lịch sử</b> để mở các lần khách đã thực hiện.','Đối chiếu ngày làm, cơ sở, nhân viên, ghi chú và chữ ký với khách trước khi tư vấn buổi tiếp theo. Nếu có sai khác, báo tài khoản có quyền xử lý thay vì tự tạo thêm buổi.']);insert_pic(11,'Lịch sử chăm sóc theo từng dịch vụ.')
h2('3.4 Thực hiện dịch vụ');steps(['Chọn <b>Thực hiện</b> tại đúng dịch vụ và kiểm tra số buổi còn lại.','Chọn cơ sở, ngày làm, nhân viên phụ trách và ghi chú rõ nội dung đã thực hiện. Sau khi xác nhận, mở lại lịch sử để chắc chắn buổi vừa làm đã được ghi nhận đúng người và đúng ngày.']);insert_pic(13,'Chọn nhân viên và ghi nhận lần thực hiện.')
h2('3.5 Lấy chữ ký khách hàng');steps(['Mở khu vực ký sau khi đã kiểm tra đúng khách, đúng dịch vụ và nội dung thực hiện.','Mời khách tự ký, kiểm tra nét ký hiển thị rõ rồi xác nhận lưu. Không ký thay khách để hoàn tất thao tác.']);insert_pic(12,'Khu vực lấy chữ ký khách hàng.');note('Chữ ký đã lưu không thể sửa. Ghi chú được chỉnh theo quyền tài khoản.')

h('4. Khách đặt lịch, lịch hẹn và liên hệ')
h2('4.1 Xem, lọc và cập nhật khách đặt lịch');steps(['Chọn ngày hoặc khoảng ngày cần xem. Khi cần rà theo ca, nhập thêm <b>Từ giờ</b> và <b>Đến giờ</b> để danh sách chỉ hiện lịch trong khung giờ đó.','Lọc tiếp theo khách, dịch vụ, cơ sở và trạng thái để lễ tân không bỏ sót lịch. Dùng đúng trạng thái <b>Đã đến</b> hoặc <b>Chưa đến</b>; không thay thế bằng nhận xét tự do.','Mở lịch để kiểm tra thông tin, sửa khi khách đổi nhu cầu/thời gian hoặc xóa khi lịch bị hủy. Sau khi lưu, quay lại danh sách và kiểm tra ngày giờ hiển thị đúng.']);insert_pic(14,'Danh sách khách đặt lịch và bộ lọc.')
h2('4.2 Tạo lịch đặt');steps(['Bấm <b>Tạo lịch đặt</b>.','Chọn khách, ngày giờ, dịch vụ, cơ sở, nhu cầu và ghi chú trước khi lưu.']);insert_pic(15,'Biểu mẫu tạo lịch đặt.')
h2('4.3 Lịch hẹn');steps(['Lịch hẹn được sinh khi khách làm liệu trình hoặc có thể thêm thủ công.','Mở lịch để kiểm tra thời gian, khách và nội dung cần chăm sóc.']);insert_pic(16,'Danh sách lịch hẹn.')
h2('4.4 Thêm ghi chú liên hệ');steps(['Mở lịch hẹn và chọn thêm lần liên hệ.','Ghi nội dung đã trao đổi và việc cần theo dõi để ca sau tiếp tục chăm sóc.']);insert_pic(17,'Thêm ghi chú và lịch sử liên hệ.')

page();h('5. Hóa đơn và thanh toán')
h2('5.1 Xem lịch sử hóa đơn');steps(['Vào <b>Bán hàng</b> để tìm hóa đơn theo khách, ngày hoặc cơ sở.','Mở hóa đơn để kiểm tra dịch vụ, số tiền, phương thức thanh toán và công nợ.']);insert_pic(18,'Danh sách và lịch sử hóa đơn.')
h2('5.2 Tạo hóa đơn');steps(['Bấm <b>Tạo hóa đơn</b>, chọn khách, cơ sở và sản phẩm/dịch vụ.','Nếu chưa có khách, tạo khách ngay trên biểu mẫu rồi quay lại chọn.','Kiểm tra giá, giảm giá, tổng tiền, khách trả, công nợ và phương thức trước khi lưu.']);insert_pic(19,'Biểu mẫu tạo hóa đơn.')
h2('5.3 Dịch vụ con, dùng ví khách và cho khách nợ');steps(['Chọn <b>Trọn đời</b> khi dịch vụ không giới hạn số lần; chọn số buổi khi có giới hạn; để số lượng 0 nếu dịch vụ con không áp dụng trong gói.','Nếu làm ngay, chọn đúng dịch vụ, nhân viên, ghi chú và chữ ký; các dịch vụ còn lại để <b>Chưa làm</b>.','Để dùng tiền trong ví, tick <b>Dùng ví khách hàng</b>. Kiểm tra số dư ví hiển thị, nhập số tiền cần dùng từ ví và kiểm tra tổng tiền hóa đơn giảm tương ứng.','Để khách còn nợ, nhập số tiền khách trả nhỏ hơn tổng tiền hóa đơn. ROSA hiển thị phần <b>Khách còn nợ hóa đơn này</b>; kiểm tra đúng số nợ trước khi lưu.','Sau khi khách thanh toán nợ, vào <b>Thu công nợ</b> để lập phiếu thu cho đúng hóa đơn.']);insert_pic(20,'Thiết lập số buổi dịch vụ con, dùng ví khách và phần tiền khách còn nợ.')
h2('5.4 Sửa hoặc xóa hóa đơn');steps(['Mở hóa đơn cần xử lý và kiểm tra lại khách, thời gian, dịch vụ, thanh toán và công nợ trước khi thay đổi.','Nhân viên được sửa hóa đơn trong ngày; tài khoản manager xử lý hóa đơn quá khứ theo quyền. Khi giảm số lượng dịch vụ, không được giảm vượt số buổi khách đã thực hiện.','Chỉ xóa khi hóa đơn không có khoản nợ đã lập phiếu thu. Kiểm tra kỹ trước khi bấm Xóa hóa đơn vì thao tác làm thay đổi lịch sử bán hàng.']);insert_pic(21,'Mở hóa đơn để sửa hoặc xóa sau khi đã kiểm tra các thông tin liên quan.')

page();h('6. Liệu trình')
h2('6.1 Danh sách liệu trình');steps(['Vào <b>Liệu trình</b> để xem các liệu trình của khách theo dịch vụ, số buổi đã dùng và số buổi còn lại.','Tìm đúng khách và mở đúng hạng mục trước khi thao tác để không thực hiện nhầm dịch vụ.']);insert_pic(22,'Danh sách liệu trình theo khách và dịch vụ.')
h2('6.2 Xem lịch sử thực hiện');steps(['Mở chi tiết hoặc lịch sử của hạng mục để xem từng buổi đã thực hiện.','Đối chiếu ngày làm, cơ sở, nhân viên, ghi chú và chữ ký trước khi chỉnh sửa. Theo quyền được cấp, có thể gán lại nhân viên, sửa ghi chú hoặc hoàn tác; staff không hoàn tác buổi quá khứ.']);insert_pic(23,'Lịch sử thực hiện của từng buổi trong liệu trình.')
h2('6.3 Thực hiện một buổi');steps(['Bấm <b>Thực hiện</b>, chọn cơ sở, ngày thực hiện và nhân viên phụ trách.','Nhập ghi chú của buổi làm, kiểm tra thông tin rồi xác nhận thực hiện. Những thay đổi sau đó tuân theo quyền của tài khoản.']);insert_pic(24,'Biểu mẫu thực hiện buổi với cơ sở, ngày, nhân viên và ghi chú.')
h2('6.4 Ký kết thúc liệu trình');steps(['Chỉ chọn <b>Ký kết thúc liệu trình</b> khi các hạng mục đã hoàn tất và khách xác nhận kết quả.','Nhập ghi chú kết thúc, mời khách ký trong vùng ký kết thúc rồi kiểm tra chữ ký trước khi xác nhận. Chữ ký kết thúc đã lưu không thể sửa; ghi chú chỉ được chỉnh theo quyền tài khoản.']);insert_pic(25,'Biểu mẫu ghi chú và vùng ký kết thúc liệu trình.')
h2('6.5 Xác nhận kết thúc');steps(['Sau khi kiểm tra lại nội dung và chữ ký, bấm xác nhận kết thúc liệu trình.','Đọc kỹ cảnh báo trước khi xác nhận: sau khi ký kết thúc, hạng mục không thể hoàn tác.']);insert_pic(26,'Hộp thoại xác nhận ký kết thúc liệu trình.')

h('7. Trang tổng quan')
h2('7.1 Tổng quan doanh thu');steps(['Mở <b>Tổng quan</b> để xem doanh thu, tiền thực thu, chi phí và dòng tiền.']);insert_pic(27,'Tổng quan doanh thu.')
h2('7.2 Khách hàng hôm nay, ngày trước và quyền xử lý buổi');steps(['Cuộn đến <b>Khách hàng hôm nay</b> để xem khách đã thực hiện trong ngày, nhân viên đang được ghi nhận, ghi chú và trạng thái chữ ký. Mở dòng khách trước khi chỉnh sửa để kiểm tra đúng buổi.','Dùng <b>Ngày trước</b> hoặc <b>Ngày xem</b> để kiểm tra dữ liệu ngày cũ; bấm <b>Hôm nay</b> để quay về dữ liệu hiện tại. Việc xem ngày cũ không làm thay đổi lịch sử thực hiện.','Tài khoản <b>Staff</b> chỉ thao tác các buổi trong phạm vi quyền được cấp. Staff không hoàn tác buổi quá khứ và không tự ý sửa nhân viên thực hiện khi không có quyền.','Tài khoản <b>Manager</b> có thể hoàn tác buổi hoặc sửa nhân viên thực hiện khi cần đối soát, theo quyền cấu hình của cơ sở. Trước khi lưu, kiểm tra lại ngày làm, nhân viên mới và ghi chú vì công ca của buổi sẽ được tính lại theo nhân viên được ghi nhận.']);insert_pic(28,'Khách hàng hôm nay, xem ngày cũ và các thao tác xử lý theo quyền.')
h2('7.3 Khách cần quan tâm và khách chưa đến');steps(['Theo dõi khách cần chăm sóc hoặc chưa đến.']);insert_pic(29,'Danh sách khách cần quan tâm và khách chưa đến.')
h2('7.4 Ghi chú quản lý lịch hẹn');steps(['Mở từng dòng khách để thêm ghi chú, nội dung liên hệ hoặc việc cần theo dõi.']);insert_pic(30,'Ghi chú quản lý lịch hẹn.');note('Nhân viên không thể hoàn tác buổi đã thực hiện trong quá khứ.')

page();h('8. Kho, ví, thu nợ và phiếu chi')
h2('8.1 Tồn kho');steps(['Vào <b>Tồn kho</b>, chọn đúng cơ sở để đối chiếu số lượng.']);insert_pic(31,'Tồn kho theo cơ sở.')
h2('8.2 Nhập kho');steps(['Vào <b>Nhập kho</b> → <b>Thêm mới</b>, chọn cơ sở, ngày, nhà cung cấp và thêm hàng hóa.','Kiểm tra tổng tiền, phương thức và ghi chú trước khi lưu.']);insert_pic(32,'Phiếu nhập kho.')
h2('8.3 Ví khách hàng');steps(['Vào <b>Ví khách hàng</b> → <b>Nạp ví</b>.','Chọn khách/cơ sở, nhập tiền nạp, thưởng, phương thức và ghi chú.']);insert_pic(33,'Ví khách hàng và lịch sử giao dịch.')
h2('8.4 Thu công nợ');steps(['Vào <b>Thu công nợ</b> → <b>Thêm mới</b>.','Thu nợ hóa đơn là nợ từ hóa đơn; thu nợ không hóa đơn là nợ cũ đã chuyển dữ liệu.','Chọn khoản nợ, nhập tiền thu, cơ sở và phương thức rồi kiểm tra tổng.']);insert_pic(34,'Phiếu thu công nợ.')
h2('8.5 Phiếu chi');steps(['Vào <b>Phiếu chi</b> → <b>Thêm mới</b>, chọn ngày/cơ sở.','Thêm khoản chi, nội dung và số tiền; kiểm tra tổng trước khi lưu.']);insert_pic(35,'Phiếu chi.')

page();h('9. Công ca, hoa hồng và báo cáo')
h2('9.1 Công ca');steps(['Vào <b>Công ca</b>, chọn khoảng ngày để xem lượt thực hiện và tổng công theo nhân viên.']);insert_pic(36,'Công ca nhân viên.')
h2('9.2 Hoa hồng tư vấn');steps(['Mở <b>Hoa hồng</b> để xem doanh số phân bổ cho tư vấn viên.']);insert_pic(37,'Hoa hồng và tư vấn.');note('Tổng doanh số là doanh số phân bổ, không phải khoản đã tính sau công thức hoa hồng.')
h2('9.3 Báo cáo tổng quan');steps(['Chọn khoảng ngày và cơ sở để xem bảng dữ liệu theo ngày.']);insert_pic(38,'Báo cáo tổng quan và dữ liệu theo ngày.')
h2('9.4 Doanh thu sản phẩm dịch vụ');steps(['Mở báo cáo doanh thu để xem phân bổ theo sản phẩm và dịch vụ.']);insert_pic(39,'Doanh thu sản phẩm và dịch vụ.')
h2('9.5 Chi tiết chứng từ và xuất Excel');steps(['Mở chi tiết chứng từ để đối chiếu.','Bấm Xuất Excel sau khi chọn đúng kỳ/cơ sở và kiểm tra tệp trước khi chia sẻ.']);insert_pic(40,'Chi tiết chứng từ.')

page();h('10. Checklist cuối ngày');tbl([('1','Đối chiếu lịch đặt, khách đã đến và khách chưa đến.'),('2','Kiểm tra hóa đơn, tiền khách trả, ví và công nợ.'),('3','Đối chiếu phiếu nhập, tồn kho và phiếu chi.'),('4','Rà công ca, hoa hồng và báo cáo theo đúng cơ sở/kỳ.'),('5','Xuất Excel khi cần tổng hợp nội bộ.')]);para('Khi cần hỗ trợ, hãy gửi tên màn hình, thời điểm, các bước vừa thực hiện và thông báo lỗi. Không gửi mật khẩu đăng nhập.')
doc.save(OUT);print(OUT)
