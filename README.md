# MWebSocket
#### websocket use heartbeat mechanism and easy to use for react

#### yarn add MWebSocket
#### import MWebSocket fron 'MWebSocket'

...
```
state = {
    data: ''
  }
  componentDidMount() {
    this.Socket = new MWebSocket('ws://123.207.167.163:9010/ajaxchattest')
    this.Socket.init()
    this.Socket.on('data', this.upDateState.bind(this))
  }
  componentWillUnmount() {
    if (this.Socket) {
      this.Socket.close()
      this.Socket.off('data', this.upDateState.bind(this))
    }
  }
  upDateState() {
    var handlerArgs = [...arguments]
    this.setState({ data: handlerArgs[0] })
  }
  ```
  ...
