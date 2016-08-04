# view 坐标分析
------
参考
[View事件分析汇总](http://blog.csdn.net/mr_immortalz/article/details/51168278)

## 一. 移动View的7种方法

### 1.Layout
```java
layout(getLeft()+50,getTop()+100,getRight()+50,getBottom()+100);
```
getLeft()等值改变。（这里指的有getLeft/getRight/getTop/getBottom)
### 2.offsetLeftAndRight, offsetTopAndBottom
```java
offsetLeftAndRight(50);
offsetTopAndBottom(100);
```
getLeft()等值改变。
### 3.修改LayoutParams
```java
ViewGroup.MarginLayoutParams lp =(ViewGroup.MarginLayoutParams)getLayoutParams();
lp.leftMargin = getLeft()+50;
lp.topMargin = getTop()+100;
setLayoutParams(lp);
```

getLeft()等值不改变。
### 4.scrollTo
```java
((View)getParent()).scrollTo(-50,-100);
```
只会移动一次。getLeft()等值不改变。

### 5.scrollBy
scrollBy的实现为：
```java
public void scrollBy(int x, int y) {
        scrollTo(mScrollX + x, mScrollY + y);
    }
```
scrollBy的使用：
```java
((View)getParent()).scrollBy(-50,-100);
```
getLeft()等值不改变。
使用**scrollTo/scrollBy**时候，要注意到
>**1.移动计算值 = 最开始点坐标 - 最后移动到的坐标**
>**2.((View)getParent()),View的scrollTo/scrollBy移动的对象是View的Content，所以在这里我们先取得要移动对象的parent，再进行移动。如果不加的话，以TextView为例子，则移动的将会是文字内容。**
>** 3.如果在ViewGroup中使用scroll,则移动的将是所有的子View.**

### 6.属性动画
```java
AnimatorSet set = new AnimatorSet();
set.playTogether(
        ObjectAnimator.ofFloat(this, "translationX", 50),
        ObjectAnimator.ofFloat(this,"translationY", 100));
set.start();
```
这种方法看效果更加丝滑。
getLeft()等值不改变。

### 7.位移动画
```java
TranslateAnimation anim = new TranslateAnimation(0,50,0,100);
anim.setFillAfter(true);
startAnimation(anim);
```
getLeft()等值不改变。

## 二.View移动动画的实现

### 1.使用layout方法
首先在继承View的类中定义两个变量用于保存前一次的公位置。
```java
private int lastX;
private int lastY;
```
再重写事件处理方法，注意，**这里返回的值为true**，表示事件已经处理过了。view中默认返回的是false。
如果使用event的getX/getY方法：
```java
 @Override
    public boolean onTouchEvent(MotionEvent event) {
        int x = (int)event.getX();
        int y = (int)event.getY();

        switch (event.getAction()){
            case MotionEvent.ACTION_DOWN:
                Logger.d("Action down");
                lastX = x;
                lastY = y;
                break;
            case MotionEvent.ACTION_MOVE:
                Logger.d("Action move");
                int offsetX = x - lastX;
                int offsetY = y - lastY;
                layout(getLeft()+offsetX,
                        getTop()+ offsetY,
                        getRight() + offsetX,
                        getBottom()+ offsetY);
                break;
            case MotionEvent.ACTION_UP:
                Logger.d("Action up");
                break;
        }
        return true;
    }
```
如果使用event的getRawX/getRawY，如下：
```java
@Override
    public boolean onTouchEvent(MotionEvent event) {
        int rawX = (int)event.getRawY();
        int rawY = (int)event.getRawY();

        switch (event.getAction()){
            case MotionEvent.ACTION_DOWN:
                lastX = rawX;
                lastY = rawY;
                break;
            case MotionEvent.ACTION_MOVE:
                int offsetX = rawX - lastX;
                int offsetY = rawY - lastY;
                layout(getLeft()+offsetX,
                        getTop()+offsetY,
                        getRight()+offsetX,
                        getBottom()+offsetY
                );
                break;
                lastX = rawX;
                lastY = rawY;
            case MotionEvent.ACTION_UP:
                break;
        }
        return true;
    }
```

>* 使用offsetLeftAndRight与ViewGroup.MarginLayoutParams方法与上面完全一样。
>* 使用getRawX/getRawY时，要注意不同，原因在于两者得到坐标区别。

### 2.使用scrollTo/scrollBy方法
如果是使用scrollBy，与上面其它方法不同的是，要注意最后有一个重新获取所在的点。
```java
@Override
    public boolean onTouchEvent(MotionEvent event) {
        int rawX = (int)event.getRawX();
        int rawY = (int)event.getRawY();

        switch (event.getAction()){
            case MotionEvent.ACTION_DOWN:
                lastX = rawX;
                lastY = rawY;
                break;
            case MotionEvent.ACTION_MOVE:
                int offsetX = rawX - lastX;
                int offsetY = rawY - lastY;
                ((View)getParent()).scrollBy(-offsetX,-offsetY);
                lastX = (int)event.getRawX();
                lastY = (int)event.getRawY();
                break;
            case MotionEvent.ACTION_UP:
                break;
        }
        return true;
    }
```
这里，如果在这个View的parent中还有其它的View,也会一起滑动。

### 2.Scroller的平滑移动
与scrollTo/ScrollBy的移动都是瞬间完成不同，Scroller类提供了一种平滑移动的效果，但是两者原理相同。使用步骤：
#### 1) 初始化Scroller
在构造方法中
```java
mScroller = new Scroller(context);
```
#### 2) 重写computeScroll()
进行模拟移动，此方法在startScroll后调用。
```java
@Override
    public void computeScroll() {
        super.computeScroll();
        //This is called in draw
        if(mScroller.computeScrollOffset()){
            ((View)getParent()).scrollTo(
                    mScroller.getCurrX(),//current scroll location
                    mScroller.getCurrY());
            invalidate();//invalidate->draw->computeScroll
        }
    }
```
computeScrollOffset是判断是否完成了整个滑动过程。
#### 3) startScroll开启模拟过程
通过startScroll方法来开启整个平滑移动过程。
在获取坐标的时候，我们通过 getScrollX/getScrollY来获取父视图中content所滑动到的点的坐标。
在onTouchEvent中：
```java
case MotionEvent.ACTION_UP:
                Log.d(TAG,"Action up");
                //getScrollX():Return the scrolled position of this view
                View viewGroup = (View)getParent();
                mScroller.startScroll(
                        viewGroup.getScrollX(),
                        viewGroup.getScrollY(),
                        -viewGroup.getScrollX(),
                        -viewGroup.getScrollY()
                );
                invalidate();
                break;
```
### 3.ViewDragHelper
通过ViewDragHelper基本可以实现各种不同的滑动等。
使用方法见
[ViewDragHelper使用方法](https://github.com/chuiyuan05/MyLib1/commit/0f5dce1307c4d760c4250796ff62a65e2a9a7ae5)




