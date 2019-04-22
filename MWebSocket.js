function MWebSocket(url) {
  this.url = url
  this.ws = null
  this.last_health_time = -1 // 上一次心跳时间
  this.reconnectMark = false //是否重连过
  this.reconnect = 0;//重连的时间
  this.receiveMessageTimer = null
  this.keepAliveTimer = null
  this.beClose = false//人为关闭
  this.handlers = {}
}
MWebSocket.prototype = {
  init() {
    this.ws = new WebSocket(this.url)
    this.begin()
  },
  keepalive() {
    let time = new Date().getTime();
    if (this.last_health_time !== -1 && time - this.last_health_time > 20000) {
      // 不是刚开始连接并且20s
      this.ws.close();
    } else {
      // 如果断网了，this.ws.send会无法发送消息出去。this.ws.bufferedAmount不会为0。
      if (this.ws.bufferedAmount === 0 && this.ws.readyState === 1) {
        this.ws.send(
          JSON.stringify({
            type: "test"
          })
        );
        this.last_health_time = time;
      }
    }
  },
  begin() {
    if (this.ws) {
      this.ws.onopen = () => {
        var self = this;
        self.reconnect = 0;
        self.reconnectMark = false;
        self.receiveMessageTimer = setTimeout(() => {
          self.ws.close();
        }, 30000); // 30s没收到信息，代表服务器出问题了，关闭连接。如果收到消息了，重置该定时器。
        if (self.ws.readyState === 1) {
          // 为1表示连接处于open状态
          self.keepAliveTimer = setInterval(() => {
            self.keepalive();
          }, 5000);
        }
      };
      this.ws.onerror = (e) => {
        console.error("onerror=>" + e);
      };
      this.ws.onclose = () => {
        var self = this;
        if (self.beClose)
          return
        clearTimeout(self.receiveMessageTimer);
        clearInterval(self.keepAliveTimer);
        if (!self.reconnectMark) {
          // 如果没有重连过，进行重连。
          self.reconnect = new Date().getTime();
          self.reconnectMark = true;
        }
        if (new Date().getTime() - self.reconnect >= 10000) {
          // 10秒中重连，连不上就不连了
          self.ws.close();
        } else {
          self.last_health_time = -1;
          self.init()
        }
      };
      this.ws.onmessage = msg => {
        msg = JSON.parse(msg.data);
        this.emit('data', new Date().getTime())
        // this.emit('data', msg)
        // 收到消息，重置定时器
        clearTimeout(this.receiveMessageTimer);
        this.receiveMessageTimer = setTimeout(() => {
          this.ws.close();
        }, 30000); // 30s没收到信息，代表服务器出问题了，关闭连接。
      };
    }
  },
  close() {
    this.beClose = true
    clearTimeout(this.receiveMessageTimer);
    clearInterval(this.keepAliveTimer);
    this.ws.close();
  },
  on(eventType, handler) {
    var self = this;
    if (!(eventType in self.handlers)) {
      self.handlers[eventType] = [];
    }
    self.handlers[eventType].push(handler);
    return this;
  },
  // 触发事件(发布事件)
  emit(eventType) {
    var self = this;
    var handlerArgs = Array.prototype.slice.call(arguments, 1);
    for (var i = 0; i < self.handlers[eventType].length; i++) {
      self.handlers[eventType][i].apply(self, handlerArgs);
    }
    return self;
  },
  // 删除订阅事件
  off(eventType, handler) {
    debugger
    var currentEvent = this.handlers[eventType];
    var len = 0;
    if (currentEvent) {
      // delete this.handlers[eventType]
      len = currentEvent.length;
      for (var i = len - 1; i >= 0; i--) {
        if (currentEvent[i].name === handler.name) {
          currentEvent.splice(i, 1);
        }
      }
    }
    return this;
  }
}

export default MWebSocket