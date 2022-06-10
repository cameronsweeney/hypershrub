import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as Redux from 'redux';
import * as ReactRedux from 'react-redux';

import * as ChakraUI from '@chakra-ui/react';

import './index.css';

import { default_data } from './kadabra.js';
import { JSONTextEntry, TerminalBox } from './components.js';
import { TreeDisplay } from './buchheim.js';

/****************************************/

function validateJsonObject(jsonString) {
  try {
      let object = JSON.parse(jsonString);
      if (typeof object === 'object' && object) {
          return object;
      }
      // https://stackoverflow.com/questions/3710204/how-to-check-if-a-string-is-a-valid-json-string
      // Handle non-exception-throwing cases:
      // Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
      // but... JSON.parse(null) returns null, and typeof null === "object", 
      // so we must check for that, too. Thankfully, null is falsey, so this suffices:

  } catch (e) {
      console.log(e);
      return false;
  }
}

/****************************************/

const initialState = {
  textbox: default_data,
  terminalHasValidated: false,
  terminalLoadState: null,
  terminalFocus: false,
  jsonObject: null,
  consoleLog: [],
  focusedNode: '.',
  focusedNodeObject: {}
}

const rootReducer = (state=initialState, action) => {

  switch (action.type) {
      case 'update':
          return {
              ...state,
              textbox: action.payload
          };
      case 'validate':
          const jsonObject = validateJsonObject(state.textbox);
          if (jsonObject) {
              return {
                  ...state,
                  terminalHasValidated: true,
                  terminalValid: true,
                  jsonObject: jsonObject
              };
          } else {
              return {
                  ...state,
                  terminalHasValidated: true,
                  terminalValid: false
              };
          }
      case 'delete':
          alert('Pretend this works. Node deleted!');
          return state;
      case 'add':
          alert('Pretend this works. Node added!')
          return state;
      case 'edit':
          alert('Pretend this works. Node edited!')
          return state;
      case 'load_terminal':
        return {
          ...state,
          terminalLoadState: 'loading',
          terminalFocus: 'true'
        }
      case 'log_console':
        const prevConsoleLog = state.consoleLog
        return {
          ...state,
          consoleLog: prevConsoleLog.concat([<p>{'\n'}{action.payload}</p>, <p>{'\n hypershrub $>'}</p>])
        }
      case 'store_cursor_animation':
        if (action.payload) {
          return {
            ...state,
            cursorAnimationObj: action.payload
          };
        } else {
          return (state);
        }
      case 'focus_terminal':
        state.cursorAnimationObj?.play();
        return {
          ...state,
          terminalFocus: true,
        };
      case 'blur_terminal':
        state.cursorAnimationObj?.pause();
        state.cursorAnimationObj?.restart();
        return {
          ...state,
          terminalFocus: false
        }
      case 'focus_node':
        alert(`Focusing node......... Trying harder.....`);
        console.log(state);
        console.log(action.payload);
        return {
          ...state,
          focusedNodeObject: action.payload,
          focusedNode: action.payload.nodePath,
          terminalFocus: false
        };
      case 'blur_node':
        return {
          ...state,
          focusedNode: false
        };
      case 'focus_prev_sibling':
        //alert(`PRESSED UP ARROW`);
        if (state.focusedNodeObject.getPrevSibling()) {
          return {
            ...state,
            focusedNodeObject: state.focusedNodeObject.getPrevSibling(),
            focusedNode: state.focusedNodeObject.getPrevSibling().nodePath
          };
        } else {
          return (state);
        }
        
      case 'focus_next_sibling':
        //alert(`PRESSED DOWN ARROW`);
        if (state.focusedNodeObject.getNextSibling()) {
          return {
            ...state,
            focusedNodeObject: state.focusedNodeObject.getNextSibling(),
            focusedNode: state.focusedNodeObject.getNextSibling().nodePath
          };
        } else {
          return (state);
        }
      case 'focus_parent':
        //alert(`PRESSED LEFT ARROW`);
        if (state.focusedNodeObject?.parent) {
          return {
            ...state,
            focusedNodeObject: state.focusedNodeObject.parent,
            focusedNode: state.focusedNodeObject.parent.nodePath
          };
        } else {
          return (state);
        }
      case 'focus_child':
        //alert(`PRESSED RIGHT ARROW`);
        if (state.focusedNodeObject.childrenNodes.length) {
          return {
            ...state,
            focusedNodeObject: state.focusedNodeObject.childrenNodes[0],
            focusedNode: state.focusedNodeObject.childrenNodes[0].nodePath
          };
        } else {
          return (state);
        }
      default:
          return (state);
  }
}

const store = Redux.createStore(rootReducer);

/****************************************/

const App = () => {
  return (
    <div className="layout_grid">
      <JSONTextEntry />
      <TerminalBox />
      <TreeDisplay />
    </div>
  );
};

/***********************************************************/

ReactDOM.render(
  <ChakraUI.ChakraProvider>
    <ReactRedux.Provider store={store}>
      <App />
    </ReactRedux.Provider>
  </ChakraUI.ChakraProvider>,
  document.getElementById('react-root')
);