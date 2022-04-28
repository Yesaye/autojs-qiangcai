console.show()
console.info("注意：提前将商品加入购物车")

//===============================================================================
//===================================可修改=================================
//===============================================================================
var timing = 0; // 执行模式   0: 立即执行   1: 5时59分50秒开始   2: 8时29分50秒开始


//===============================================================================
//===================================基础配置=================================
//===============================================================================
const listData = [
    {words: "结算",matchType: 1,delay: 1000},
    {words: "我知道了",matchType: 0,delay: 0},
    {words: "返回购物车",matchType: 0,delay: 0},
    {words: "极速支付",matchType: 0,delay: 0},
    {words: "立即支付",matchType: 0,delay: 0},
    {words: "确认并支付",matchType: 0,delay: 0},
    {words: "重新加载",matchType: 0,delay: 500},
    {words: "免密支付",matchType: 0,delay: 1000}
];
const times = [false, [5, 59, 50],[8, 29,50]];


// 开始执行
run();

// 主程序
function run() {
    timingStart(times[timing]);

    console.info("打开美团买菜")
    launchApp("美团买菜")

    var stipBtnThread = threads.start(function () {
        clickTextOnce("跳过", 0)
    })
    var qrBtnThread = threads.start(function () {
        clickTextOnce("确认选择", 0)
    })

    console.info("点击购物车")
    threads.start(function () {
        id("img_shopping_cart").findOne().parent().click();
        stipBtnThread.interrupt();
        qrBtnThread.interrupt();
    })
    
    console.info("全选购物车")
    seelctAllcart();
    
    console.info("开启监测线程")
    listenThreads();
    console.info("开始抢购")
    startClickThreads(listData);

}

//===============================================================================
//===================================震动方式=================================
//===============================================================================
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

//===============================================================================
//===================================额外功能=================================
//===============================================================================
// 全选购物车
function seelctAllcart() {
    var j1 = getCartNum();
    if (j1 == 0) {
        text("全选").findOne().parent().click();
    } else {
        text("全选").findOne().parent().click();
        while (true) {
            var j2 = getCartNum();
            if (j1 != j2) {
                if(j2 == 0){
                    text("全选").findOne().parent().click();
                }
                break;
            }
        }
    }
}

// 获取购物车数量
function getCartNum() {
    var temp = textStartsWith("结算").findOne().text().match(/\d+/);
    return temp ? temp[0] : 0;
}

// 监测线程
function listenThreads() {
    // 监测抢购成功
    threads.start(function () {
        className("android.widget.TextView").text("支付成功").findOne();
        console.info("恭喜您，抢购成功");
        successShock();
        console.info("结束");
        threads.shutDownAll();
    })
}

// 延迟阻塞
function timingStart(time) {
    if (time) {
        console.info("准备定时执行，目标时间: " + time[0] + "时" + time[1] + "分" + time[2] + "秒")
        while (true) {
            let date = new Date();
            if (date.getHours() == time[0] && date.getMinutes() == time[1] && date.getSeconds() == time[2]) {
                break;
            }
            console.info("当前时间:" + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds())
            sleep(1000)
        }
    }
}

//===============================================================================
//===================================文字点击部分=================================
//===============================================================================
// 批量开启文字点击线程
function startClickThreads(list) {
    for (let i = 0; i < list.length; i++) {
        (function abc(j) {
            threads.start(function () {
                clickTextLoop(list[j].words, list[j].delay, list[j].matchType)
            })
        })(i)
    }
}

// 基础点击方法 t-文字 d-间隔 m-匹配类型
function clickTextLoop(t, d, m) {
    console.info("初始化线程:" + t + " " + d + " " + m)
    for(let j = 1;;j++){
        findParentClick(matchText(t, m).findOne(), 1);
        console.info("第" + j + "次'" + t + "'")
        if (d != 0) {
            sleep(d)
        }
    }
}

// 基础点击方法 t-文字 m-匹配类型
function clickTextOnce(t, m){
    findParentClick(matchText(t, m).findOne(), 1);
    console.info("点击'" + t + "'")
}

// 匹配文字
function matchText(t, m){
    let tv = className("android.widget.TextView");
    let temp = m == 0 ? tv.text(t) :
        m == 1 ? tv.textStartsWith(t) :
        m == 2 ? tv.textEnds(t) :
        tv.textContains(t);
    return temp;
}

// 向上点击
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
