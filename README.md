# pack

> 封装的 webpack 打包器

## use

```
npm install @zhangxg/pack
```
支持
1. vue
2. react
3. typescript

## example

引入模块，传入 webpack 的参数，详细见文档[webpack5](https://webpack.docschina.org/)

```js
const config = require("./config");
const pack = require("@zhangxg/pack");
pack(config);
```

## attention

1. 如果是 web 开发，必须有一个 index.html，html 的位置可以在 public 中,也可以是与 entry 入口共同位置,如果 entry 为一个对象，且有 template 字段，则优先使用其作为主 html
