auto("normal")
console.show()
console.info("注意：提前清空购物车和预约的到货提醒")

console.info("初始化参数")
var textArray = ["纸","洗衣液"];
var first = true;
var i = -1;
// 每个商品时间间隔（分钟）
var interval = 1;
// 检测卡住的时间限制（分钟）
var ckTimeout = 1;

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
    run()
}

// 向上搜寻点击
function findParentClick(p, deep) {
    if (p.clickable()) {
        p.click();
    } else {
        if ((deep++) > 6) {
            toast("click err")
            return;
        }
        findParentClick(p.parent())
    }
}

// 抢购（美团）
function run() {
    var textArray = [
        ["结算", 1000, true],
        ["我知道了", 0, false],
        ["返回购物车", 0, false],
        ["极速支付", 0, false],
        ["立即支付", 0, false],
        ["确认并支付", 0, false]
    ]
    var tArray = new Array();
    for (var i = 0, j = 0; i < textArray.length; i++, j = 0) {
        function abc(iii, jjj) {
            tArray[iii] = threads.start(function () {
                clickText(textArray[iii][jjj], textArray[iii][jjj + 1], textArray[iii][jjj + 2])
            })
        }
        abc(i, j)
    }
}

// 基础点击方法
function clickText(t, d, start) {
    console.info("初始化线程:" + t + " " + d + " " + start)
    var j = 1;
    while (true) {
        var temp = start ? textStartsWith(t) : text(t);
        if (temp.exists) {
            temp.findOne().parent().click()
            console.info("第" + j++ + "次'" + t + "'")
        }
        if (d != 0) {
            sleep(d)
        }
    }
}

// 警报震动
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

// 成功震动
function successShock() {
    for (i = 0; i < 5; i++) {
        device.vibrate(1000)
        sleep(1500)
    }
}