console.show()

// 配置（不需要修改）
const listData = [
    {words:"结算",matchType:1,delay:1000},
    {words:"我知道了",matchType:0,delay:0},
    {words:"返回购物车",matchType:0,delay:0},
    {words:"极速支付",matchType:0,delay:0},
    {words:"立即支付",matchType:0,delay:0},
    {words:"确认并支付",matchType:0,delay:0}
];
const times = [false, [5,59,50], [8,29,30]]

// 下面参数自行修改
var timing = 1; // 执行模式 0: 立即执行 1: 5时59分50秒开始 2: 8时29分50秒开始

// 开始执行
run();

// 主程序
function run(){
    timingStart(times[timing]);

    console.info("打开美团买菜")
    launchApp("美团买菜")
    
    console.info("点击跳过")
    var stipBtnThread = threads.start(function(){
        text("跳过").findOne().parent().click();
    })
    
    console.info("点击购物车")
    var cartBtnThread = threads.start(function(){
        id("img_shopping_cart").findOne().parent().click();
        stipBtnThread.interrupt()
    })

    console.info("全选购物车")
    var j1 = getCartNum();
    if(j1!=0){
        text("全选").findOne().parent().click();
        while(true){
            var j2 = getCartNum();
            if(j2==0 || j1!=j2){
                break;
            }
        }
        if(getCartNum()==0){
            text("全选").findOne().parent().click();
        }
    } else {
        text("全选").findOne().parent().click();
    }

    console.info("4、开始抢购")
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

// 获取购物车数量
function getCartNum(){
    var temp = textStartsWith("结算").findOne().text().match(/\d+/);
    return temp?temp[0]:0;
}

// 监测线程
function listenThreads(){
    // 监测抢购成功
    threads.start(function(){
        className("android.widget.TextView").text("支付成功").findOne();
        threads.shutDownAll();
        console.info("恭喜您，抢购成功");
        successShock();
        console.info("结束");
    })
    // 检测购物车全部没货
    threads.start(function(){
        while(true){
            if(getCartNum()==0){
                threads.shutDownAll();
                console.info("抢购失败，已经全部没货啦");
                alertShock();
                console.info("结束");
            }
        }
    })

}

function timingStart(time){
    if(time!=null){
        console.info("准备定时执行，目标时间: "+time[0]+"时"+time[1]+"分"+time[2]+"秒")
        while(true){
            let date = new Date();
            if(date.getHours()==time[0] && date.getMinutes()==time[1] &&date.getSeconds()==time[2] ){
                break;
            }
            console.info("当前时间:"+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds())
            sleep(1000)
        }
    }
}