const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const salaryElem = document.getElementById("salary");
const moneyElem = document.getElementById("money");
const messageElem = document.getElementById("message");
const pauseBtn = document.getElementById("pauseBtn");
const shop = document.getElementById("shop");

// 効果音
const taxSound = document.getElementById("taxSound");
const itemSound = document.getElementById("itemSound");
const fizzSound = document.getElementById("fizzSound");
const gameoverSound = document.getElementById("gameoverSound");
const cashSound = document.getElementById("cashSound");
const clickSound = document.getElementById("clickSound");

// データ
let salary = parseInt(localStorage.getItem('salary')) || 1000;
let money = parseInt(localStorage.getItem('money')) || 0;
let items = JSON.parse(localStorage.getItem('items')) || {};
salaryElem.textContent = salary;
moneyElem.textContent = money;
let paused = false;

// プレイヤー
const player = { x: 300, y: 350, width: 30, height: 30, speed: 5 };

// 弾
let bullets = [];

// 弾画像
const bulletImg = new Image();
bulletImg.src = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgyqLExwFsRkq681UaahqxMrGo4l5kRj35ij9Cw-FatA9CJ0ye8zZCYRZHFObAEXzVzpRGytV13w14KXeDjN65RRAtr6tFevc_EGofNQmZdT2jYAABxL77r-XbvmF_Nn3nuEweGlilowdyo/s800/gin_dangan_silver_bullet.png";

// 色分け
function getTaxColor(type){
  switch(type){
    case "consumption": return "yellow";
    case "gas": return "blue";
    case "property": return "red";
    case "social": return "purple";
    case "reconstruction": return "orange";
    case "income": return "green";
    default: return "white";
  }
}

// 弾生成
function spawnBullet(){
  const types = ["consumption","gas","property","social","reconstruction","income"];
  const type = types[Math.floor(Math.random()*types.length)];
  bullets.push({
    x:Math.random()*570,
    y:0,
    width:20,
    height:20,
    type:type,
    speed:2+Math.random()*2
  });
}

// プレイヤー描画
function drawPlayer(){
  ctx.fillStyle = "green";
  ctx.beginPath();
  ctx.arc(player.x+player.width/2, player.y+player.height/2, player.width/2, 0, Math.PI*2);
  ctx.fill();
}

// 丸弾描画（画像＋色味）
function drawBullet(b){
  ctx.save();
  ctx.beginPath();
  ctx.arc(b.x+b.width/2,b.y+b.height/2,b.width/2,0,Math.PI*2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(bulletImg, b.x, b.y, b.width, b.height);
  ctx.globalCompositeOperation = "source-atop";
  ctx.fillStyle = getTaxColor(b.type);
  ctx.fillRect(b.x, b.y, b.width, b.height);
  ctx.restore();
}

// 税金処理
function applyTax(type){
  if(items.taxEvasion){
    showMessage("脱税で税金回避！⚠️");
    return;
  }
  let amount = 0;
  switch(type){
    case "consumption": amount=20; break;
    case "gas": amount=30; break;
    case "property": amount=50; break;
    case "social": amount=80; break;
    case "reconstruction": amount=25; break;
    case "income": amount=Math.floor(salary*0.2); break;
  }
  salary -= amount;
  salaryElem.textContent = salary;
  taxSound.currentTime=0; taxSound.play();
  saveGame();
  if(salary <= 500){
    showMessage("給料半分以下！GAME OVER");
    gameoverSound.play();
    paused = true;
  }
}

// メッセージ表示
function showMessage(msg){
  messageElem.textContent = msg;
  setTimeout(()=>{messageElem.textContent="";},2000);
}

// 更新ループ
function update(){
  if(!paused){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    bullets.forEach(b=>{
      b.y += b.speed;
      drawBullet(b);
      // 衝突判定
      if(b.x < player.x+player.width &&
         b.x+b.width > player.x &&
         b.y < player.y+player.height &&
         b.y+b.height > player.y){
        applyTax(b.type);
        bullets = bullets.filter(x=>x!==b);
      }
    });
    drawPlayer();
  }
  requestAnimationFrame(update);
}

// 弾生成間隔
setInterval(spawnBullet,1000);
update();

// キー操作
document.addEventListener("keydown",(e)=>{
  if(e.key==="ArrowLeft" && player.x>0) player.x-=player.speed;
  if(e.key==="ArrowRight" && player.x<canvas.width-player.width) player.x+=player.speed;
});

// 一時停止・ショップ
pauseBtn.addEventListener("click",()=>{
  paused = !paused;
  shop.classList.toggle("hidden",!paused);
  pauseBtn.textContent = paused ? "再開" : "一時停止";
  clickSound.currentTime=0; clickSound.play();
});

// アイテム購入
shop.querySelectorAll("button").forEach(btn=>{
  btn.addEventListener("click",()=>{
    const item = btn.dataset.item;
    buyItem(item);
    clickSound.currentTime=0; clickSound.play();
  });
});

// アイテム効果
function buyItem(item){
  switch(item){
    case "car":
      if(money>=100){ money-=100; items.car=true; itemSound.play(); showMessage("車を売った！固定資産税50%カット"); }
      break;
    case "vote":
      if(money>=10){ money-=10; items.vote=true; itemSound.play(); showMessage("選挙権使用！"); }
      break;
    case "taxEvasion":
      if(money>=50){ money-=50; items.taxEvasion=true; itemSound.play(); showMessage("脱税開始！税金回避"); setTimeout(()=>{items.taxEvasion=false; showMessage("脱税終了");},5000); }
      break;
    case "move":
      if(money>=30){ money-=30; showMessage("引越し！住民税ランダム変更"); }
      break;
    case "onsen":
      if(money>=20){ money-=20; salary-=50; showMessage("温泉入湯税50"); } 
      break;
    case "alcohol":
      if(money>=15){ money-=15; showMessage("フィーバータイム！酒・タバコ税発生"); fizzSound.play(); }
      break;
  }
  moneyElem.textContent = money;
  saveGame();
}

// 保存
function saveGame(){
  localStorage.setItem('salary', salary);
  localStorage.setItem('money', money);
  localStorage.setItem('items', JSON.stringify(items));
}
