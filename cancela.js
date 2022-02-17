"use strict";
module.exports = function (RED) {
  function Cancela(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    var st;
    var global = this.context().global;
    var flow = this.context().flow;
    var tentativas;
    var intervalo;
    var sensor_cancela;
    var _msg;

    function abreCancela() {
      node.status({
        fill: "green",
        shape: "dot",
        text: `Abrindo cancela ${tentativas}`,
      });
      // verifica cancela esta aberta
      if (global.get(sensor_cancela) == true) {
        //aberta envia para saida done
        _msg.payload = "done";
        node.send([null, _msg, null]);
        tentativas = 0;
        node.status({ fill: "green", shape: "dot", text: "Cancela aberta" });
      } else {
        //fechada envia comando ao clp
        node.send([_msg, null, null]);
      }
      tentativas--;

      if (tentativas > 0) {
        st = setTimeout(abreCancela, intervalo);
      }
      if (tentativas <= 0 && global.get(sensor_cancela) == false) {
        node.status({
          fill: "red",
          shape: "dot",
          text: "Falha na abertura de cancela",
        });
        _msg.payload = "error";
        node.send([null, null, _msg]);
      }
    }

    function fechaCancela() {
      node.status({
        fill: "green",
        shape: "dot",
        text: `Fechando cancela ${tentativas}`,
      });
      // verifica cancela esta aberta
      if (global.get(sensor_cancela) == false) {
        //aberta envia para saida done
        _msg.payload = "done";
        node.send([null, _msg, null]);
        tentativas = 0;
        node.status({ fill: "green", shape: "dot", text: "Cancela fechada" });
      } else {
        //fechada envia comando ao clp
        _msg.payload = true;
        node.send([_msg, null, null]);
      }
      tentativas--;

      if (tentativas > 0) {
        st = setTimeout(fechaCancela, intervalo);
      }
      if (tentativas <= 0 && global.get(sensor_cancela) == true) {
        node.status({
          fill: "red",
          shape: "dot",
          text: "Falha no fechamento da cancela",
        });
        _msg.payload = "error";
        node.send([null, null, _msg]);
      }
    }

    node.on("input", function (msg, send, done) {
      if (msg.comando) {
        tentativas = msg.tentativas;
        intervalo = msg.intervalo;
        sensor_cancela = msg.sensor_cancela;
        _msg = msg;
        clearTimeout(st);
        if (msg.comando == "A") {
          msg.payload = "abre";
          try {
            abreCancela();
          } catch (error) {
            done(error);
          }
        } else if (msg.comando == "F") {
          msg.payload = "fecha";
          try {
            fechaCancela();
          } catch (error) {
            done(error);
          }
        } else {
          msg.payload = "comando nao definido";
        }
      } else {
        msg.payload = "msg.comando nao encontrado";
      }
    });

    this.on("close", function (removed, done) {
      // removed not used
      clearTimeout(st);
      node.status({});
      done();
    });
  }
  RED.nodes.registerType("cancelaTOS", Cancela);
};
