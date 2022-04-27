auto("normal")
console.show()
console.info("注意：提前清空购物车和预约的到货提醒")

console.info("初始化参数")
var first = true;
var i = -1;


// 可修改
// ============================================
// 要捡漏的品类
var textArray = ["纸","洗衣液"];
// 每个商品时间间隔（分钟）
var interval = 1;
// 检测卡住的时间限制（分钟）
var ckTimeout = 1;
// ============================================

// 美团买菜配置
const listData = [
    {words:"结算",matchType:1,delay:1000},
    {words:"我知道了",matchType:0,delay:0},
    {words:"返回购物车",matchType:0,delay:0},
    {words:"极速支付",matchType:0,delay:0},
    {words:"立即支付",matchType:0,delay:0},
    {words:"确认并支付",matchType:0,delay:0}
];

console.info("打开美团买菜")
app.launchPackage("com.meituan.retail.v.android")

while (true) {
    // 监测线程,震动提醒
    var ckThread = threads.start(() => {
        setTimeout(() => {
            console.info("检查一下是不是卡住了！！！")
            alertShock();
        }, (ckTimeout+interval) * 60 * 1000)
    })

    i = (i + 1) == (textArray.length) ? 0 : i + 1;
    console.info("当前索引:" + i + " 商品:" + textArray[i])

    if (first) {
        console.info("点击搜索框")
        className("android.widget.TextView").text("搜索").depth(19).findOne().parent().click()
        first = false;
    } else {
        console.info("点击搜索框")
        className("android.view.ViewGroup").clickable(true).depth(15).findOne().click()
    }

    console.info("寻找输入框，输入商品名：" + textArray[i]);
    className("android.widget.EditText").findOne().setText(textArray[i])

    console.info("点击搜索")
    text("搜索").findOne().parent().click()

    console.info("查看是否有货，等待 " + textArray[i] + " 的文字出现")
    while (true) {
        var tt = textContains(textArray[i]).untilFind();
        if (tt.length > 2) {
            break;
        }
        sleep(200);
    }
    console.info("查找￥，点击第一个商品")
    findParentClick(textContains("¥").untilFind()[0], 1)

    var state = 0;
    var dhtx, jrgwc;
    dhtx = threads.start(function () {
        console.info("判断出现‘到货提醒’")
        text("到货提醒我").waitFor();
        console.info("出现‘到货提醒’，返回，开始下一个商品’")
        back()
        state = 1
        sleep(100)
        jrgwc.interrupt()
    })
    jrgwc = threads.start(function () {
        console.info("判断出现‘加入购物车’")
        text("加入购物车").waitFor();
        console.info("出现‘加入购物车’，开始加入购物车")
        text("加入购物车").findOne().parent().parent().click()
        dhtx.interrupt()
    })
    dhtx.join()
    jrgwc.join()
    ckThread.interrupt()
    if (state == 1) {
        console.info("延迟"+interval+"分钟再开始下一个")
        sleep(interval*60*1000)
        continue;
    }

    console.info("查找数字，进入购物车")
    var matchNums = textMatches("\\d+").find();
    matchNums[matchNums.length-1].parent().parent().click();

    console.info("震动提醒")
    threads.start(() => {
        successShock();
    })
    console.info("开始抢购")
    startClickThreads(listData);
}


// 批量开启文字点击线程
function startClickThreads(list){
    var tArray = new Array();
    for (var i = 0; i < list.length; i++) {
        (function abc(j) {
            tArray[j] = threads.start(function () {
                clickText(list[j].words,list[j].delay,list[j].matchType)
            })
        })(i)
    }
}

// 基础点击方法 t-文字 d-延迟 m-匹配类型
function clickText(t, d, m) {
    console.info("初始化线程:" + t + " " + d + " " + m)
    var j = 1;
    while (true) {
        var temp = m==0 ? className("android.widget.TextView").text(t) : 
                   m==1 ? className("android.widget.TextView").textStartsWith(t) : 
                   m==2 ? className("android.widget.TextView").textEnds(t) : 
                   className("android.widget.TextView").textContains(t);
        if (temp.exists) {
            findParentClick(temp.findOne(), 1)
            console.info("第" + j++ + "次'" + t + "'")
        }
        if (d != 0) {
            sleep(d)
        }
    }
}

// 向上点击
function findParentClick(p,deep){
    if(p.clickable()){
        p.click();
    } else {
        if((deep++)>6){
            toast("click err")
            return;
        }
        findParentClick(p.parent())
    }
}

// 成功震动 10秒
function successShock() {
    for (i = 0; i < 5; i++) {
        device.vibrate(300)
        sleep(500)
        device.vibrate(1000)
        sleep(1500)
    }
}
// 警报震动 19秒
function alertShock() {
    for (i = 0; i < 10; i++) {
        device.vibrate(300)
        sleep(300)
        device.vibrate(800)
        sleep(800)
        device.vibrate(400)
        sleep(800)
    }
}
