/*
 * 病毒传播模拟程序
 * 模拟出来的结果并不代表真实结果
 * 作者: 周子阳 编程猫深圳市天悦龙庭校区
 */

/*
 * 红色代表感染者
 * 绿色代表未感染者
 * 蓝色代表被隔离人群
 */

const PEOPLE_AMOUNT = 1000; // 人数
const PROTECT = 0.06; // 被感染率
const BEDS = 100; // 病床床位
const PEOPLE_SPEED = 0.03; // 人群平均移动速度
const INIT_UNHEALTHY = 120; // 初始感染者数量
const HAPPY_HEALTHY_DAY = 1; // 康复期（秒）

const WIDTH = 800;
const HEIGHT = 600;
const BGCOLOR = 0x000;

const POINT_SIZE = 3; // 小圈圈的大小
const GREEN = '#00ff00';
const BLUE = '#00ffff';
const RED = '#ff0000';

const PEOPLE = []; // 储存所有人
const PEOPLE_HEALTHY = []; // 储存所有未感染者
const PEOPLE_UNHEALTHY = []; // 储存所有感染者
const PEOPLE_IS_BREAK = [] // 储存所有被隔离者

/**
 * 半径碰撞检测
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @param {number} r1
 * @param {number} r2
 */
function radiusCollider(x1, y1, x2, y2, r1, r2 = 0) {
    /**
     * 获取两点之间的距离
     * 根据勾股定理：a^2 + b^2 = c^2
     */
    function distance(x1, y1, x2, y2) {
        a = abs(x1 - x2);
        b = abs(y1 - y2);
        c = sqrt(a ** 2 + b ** 2);
        return c;
    }
    centerX1 = x1 + r1;
    centerY1 = y1 + r1;
    centerX2 = x2 + r2;
    centerY2 = y1 + r2;
    if (distance(centerX1, centerY1, centerX2, centerY2) <= r1 + r2) {
        return true;
    }
    return false;
}

/**
 * 随机概率是否发生
 * @param {float} 概率，百分数
 */
function randomGL(gl) {
    // 随机从列表获取一个项
    function choice(a) {
        return a[floor(random(a.length - 1))];
    }
    let temp = new Array(100).fill(0);
    for (let i = 0; i < gl * 100; i++) {
        temp[i] = 1;
    }
    if (choice(temp) == 1) {
        temp = null;
        return true;
    }
    temp = null;
    return false;
}

/**
 * @param bool 是否健康，如果不健康，则hasMask参数为null
 * @param bool 如果健康，是否戴口罩
 */
class People {
    x = random(0, WIDTH);
    y = random(0, HEIGHT);
    // 高能：高斯随机数
    // 给定一个基点，根据基点产生随机差值
    vx = randomGaussian(0, PEOPLE_SPEED);
    vy = randomGaussian(0, PEOPLE_SPEED);
    
    isBreak = false; // 是否被隔离
    inBreakTime = null; // 入院日期（帧数）

    constructor(isHealthy, hasMask = false) {
        this.isHealthy = isHealthy;
        if (isHealthy) {
            this.hasMask = hasMask;
            if (this.hasMask) {
                this.color = GREEN;
            } else {
                this.color = BLUE;
            }
        } else {
            this.hasMask = null;
            this.color = RED;
        }
    }

    auto() {
        if (this.isHealthy) {
            this.color = GREEN;
        } else if (this.isBreak) {
            this.color = BLUE;
        } else {
            this.color = RED;
        }
    }

    render() {
        stroke(this.color);
        strokeWeight(POINT_SIZE);
        point(this.x, this.y);
    }

    move() {
        if (this.x < 0 || this.x > WIDTH) {
            this.vx *= -2;
        }
        if (this.y < 0 || this.y > HEIGHT) {
            this.vy *= -1;
        }
        if (!this.isBreak) {
            this.x += this.vx;
            this.y += this.vy;
        }
    }

    doesBreakTimeOut() {
        if (this.isBreak) {
            if (frameCount > this.inBreakTime + frameRate() * HAPPY_HEALTHY_DAY) {
                this.isHealthy = true;
                this.isBreak = false;
                this.inBreakTime = null;
                PEOPLE_IS_BREAK.pop();
            }
        }
    }

    ifGetSick() {
        if (this.isHealthy == false && !this.isBreak) {
            for (let i = 0; i < PEOPLE_HEALTHY.length; i++) {
                if (
                    radiusCollider(
                        this.x,
                        this.y,
                        PEOPLE_HEALTHY[i].x,
                        PEOPLE_HEALTHY[i].y,
                        POINT_SIZE / 2,
                        POINT_SIZE / 2
                    )
                ) {
                    if (randomGL(PROTECT)) {
                        PEOPLE_HEALTHY[i].isHealthy = false;
                        PEOPLE_UNHEALTHY.push(PEOPLE_HEALTHY[i]);
                        PEOPLE_HEALTHY.splice(i, 1);
                    }

                    break;
                }
            }
        }
    }
}

function clog() {
    // console.table(PEOPLE);
    // console.table(PEOPLE_HEALTHY);
    // console.table(PEOPLE_UNHEALTHY);
    console.log(randomGL(1));
}

function setup() {
    // 如果用户离开窗口就停止动画，回到窗口时继续动画
    window.onblur = noLoop;
    window.onfocus = loop;

    canvas = createCanvas(WIDTH, HEIGHT);

    // 初始化人群
    for (let i = 0; i < PEOPLE_AMOUNT; i++) {
        PEOPLE.push(new People(true, true));
    }

    // 初始化感染人数人
    for (let i = 0; i < INIT_UNHEALTHY; i++) {
        PEOPLE[i].isHealthy = false;
        PEOPLE_UNHEALTHY.push(PEOPLE[i]);
    }

    for (let i = INIT_UNHEALTHY; i < PEOPLE_AMOUNT; i++) {
        PEOPLE_HEALTHY.push(PEOPLE[i]);
    }
}

function draw() {
    background(BGCOLOR);

    for (let i = 0; i < PEOPLE_AMOUNT; i++) {
        PEOPLE[i].render();
        PEOPLE[i].move();
        PEOPLE[i].auto();
        PEOPLE[i].ifGetSick();
        PEOPLE[i].doesBreakTimeOut();
    }

    for (let i = 0; i < PEOPLE_UNHEALTHY.length; i++) {
        if (PEOPLE_IS_BREAK.length < BEDS && !PEOPLE_UNHEALTHY[i].isBreak) {
            PEOPLE_UNHEALTHY[i].isBreak = true;
            PEOPLE_UNHEALTHY[i].inBreakTime = frameCount;
            PEOPLE_IS_BREAK.push(PEOPLE_UNHEALTHY[i]);
        }
    }
}
