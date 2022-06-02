import React from 'react';
import * as ReactRedux from 'react-redux';
import { IconButton, Button } from '@chakra-ui/react';
import { EditIcon, AddIcon, CloseIcon } from '@chakra-ui/icons';
import Typewriter from 'react-typewriter';

import anime from 'animejs/lib/anime.es.js';



/******************************* */

function terminalValidSelector(state) {
    if (state.terminalHasValidated) {
        if (state.terminalValid) {
            return 'valid';
        }
        else { return 'invalid' }
    } else {
        return false;
    }
  }

/****************************/



/*******************************************/



const TerminalValidResult = () => {
    const terminalValidState = ReactRedux.useSelector(terminalValidSelector);

    if (!terminalValidState) {
        return (<p>Click button to validate JSON</p>);
    } else if (terminalValidState === 'valid') {
        return (<p className="valid">Congratulations, you are valid! &#10004;</p>);
    } else {
        return (<p className="invalid">Uh-oh, you aren't valid! &#10060;</p>);
    }
};

/***************************************/

export const JSONTextEntry = () => {
    const textbox = ReactRedux.useSelector( (state) => (state.textbox) );
    const dispatch = ReactRedux.useDispatch();

    return (
    <div className="control_panel">
        <textarea
            onFocus={ (event) => dispatch({ type: 'blur_terminal', payload: event.target.value }) }
            onBlur={ (event) => dispatch({ type: 'update', payload: event.target.value }) }
            defaultValue={textbox}>
        </textarea>
        <div>
            <Button bg='purple.600' color='white' onClick={ () => dispatch({type: 'validate'})}>Validate JSON</Button>
            <TerminalValidResult />
        </div>
    </div>
    );
};

export const TerminalCursor = () => {
    const dispatch = ReactRedux.useDispatch();
    const terminalFocus = ReactRedux.useSelector( (state) => (state.terminalFocus) );
    const bottomRef = React.useRef(null);

    React.useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        anime.remove('.terminal_cursor');
        anime.set('.terminal_cursor', { opacity: 0 });
        dispatch({type: 'store_cursor_animation', 
            payload: (terminalFocus) ? anime({
                targets: '.terminal_cursor',
                opacity: [-1, 1],
                loop: true,
                direction: 'alternate',
                easing: 'steps(2)',
                })
            : null});
      });

    return (<span className='terminal_cursor' ref={bottomRef}>|</span>);

}

export const TerminalBox = () => {
    const terminalLoadState = ReactRedux.useSelector( (state) => (state.terminalLoadState) );
    const consoleLog = ReactRedux.useSelector( (state) => (state.consoleLog) );
    const terminalFocus = ReactRedux.useSelector ( (state) => (state.terminalFocus) );
    const dispatch = ReactRedux.useDispatch();
    const commandLineRef = React.useRef(null);

    const greeting = [
        <p>{'>'}Booting up terminal...{'\n'}</p>,
        <p>{'>'}Hypershrub - React Tree Editor v1.0.0</p>,
    ]

    React.useEffect( () => {
        if (terminalFocus) {commandLineRef.current?.focus();}
        else {commandLineRef.current?.blur();}
    } )

    if (!terminalLoadState) { // not yet loaded, display button
        return (
            <div className='terminal'>
                <Button bg='purple.600' color='white' 
                onClick={ () => {dispatch({type: 'load_terminal'});} } 
                >USE TERMINAL INTERFACE</Button>
            </div>
        );
    } else {
        return (
            <div className='terminal'>
                <Typewriter typing={1} 
                  onTypingEnd={ () => dispatch({type: 'log_console', payload: ''}) }>{greeting}</Typewriter>
                <span className='console'>{consoleLog}</span>
                <span><span className='command_line' ref={commandLineRef} contentEditable></span><TerminalCursor /></span>
            </div>
        );
    }
};


//////////////////////////////////////////////////////////

const SimpleNode = (node) => {
    const focusedNode = ReactRedux.useSelector( (state) => (state.focusedNode) );
    const dispatch = ReactRedux.useDispatch();
    const content = (node.content) ? node.content : null;

    const isThisNodeFocused = (node.id === focusedNode)
    const focusDivStyle = isThisNodeFocused ? {border: 'thick var(--color-node-focus) solid'} : ({});
    const focusH1Style = isThisNodeFocused ? {backgroundColor: 'var(--color-node-focus)', borderRadius: 'var(--measure-1) 0 var(--measure-1) 0'} : ({});

    return (
        <div className="parentbox">
        <div id={node.id} className="node" style={focusDivStyle}>
            <h1 key={node.idRef + '.label'} style={focusH1Style}>{node.label}</h1>
            <div>
                <IconButton bg='purple.600' color='white' size='xs' aria-label='Edit node' icon={<EditIcon />}
                    onClick ={ () => dispatch({type: 'log_console', payload: 'Our sincerest apologies. This feature is not yet available. Do have a wonderful day!'}) }
                    />
                <IconButton bg='purple.600' color='white' size='xs' aria-label='Add new child node' icon={<AddIcon />} 
                    onClick={ () => dispatch({type: 'focus_terminal'}) }
                    />
                <IconButton bg='purple.600' color='white' size='xs' aria-label='Delete node' icon={<CloseIcon />} 
                    onClick={ () => dispatch({type: 'blur_terminal'}) }
                    />
            </div>
            <p key={node.idRef + '.content'}>{content}</p>
        </div>
        </div>
    );
};

const ListNode = (node) => {
    const dispatch = ReactRedux.useDispatch();

    const listElements = node.content.map( (x) => <li key={x}>{x}</li> );

    return (
        <div>
        <div id={node.id} className="list node">
            <div>
                <IconButton bg='purple.600' color='white' size='xs' aria-label='Edit node' icon={<EditIcon />}
                    onClick ={ () => dispatch({type: 'edit'}) }
                    />
                <IconButton bg='purple.600' color='white' size='xs' aria-label='Add new child node' icon={<AddIcon />} 
                    onClick={ () => dispatch({type: 'add'}) }
                    />
                <IconButton bg='purple.600' color='white' size='xs' aria-label='Delete node' icon={<CloseIcon />} 
                    onClick={ () => dispatch({type: 'delete'}) }
                    />
            </div>
            <h1>{node.label}</h1>
            <ul>{listElements}</ul>
        </div>
        </div>
    );
}

const ChildrenNodes = (node) => {
    let nodeTree = [];

    if (node.object) {
        for (let current_key in node.object) {
             let idRef = `${node.parentRef}/${current_key}`;
            //let arrowRef = `${idRef}.arrow`;
            let value = node.object[current_key];

            if (Array.isArray(value)) {
                nodeTree.push(<ListNode id={idRef} key={idRef} label={current_key} content={value} />);
            } else if (typeof value === 'object') {
                nodeTree.push(<div key={current_key+'.children'} className={node.parentRef + ' children'} >
                    <SimpleNode id={idRef} key={idRef} label={current_key} />
                    <ChildrenNodes parentRef={idRef} object={value} />
                </div>
                );
            } else {
                nodeTree.push(<SimpleNode id={idRef} key={current_key} label={current_key} content={value} />);
            }
            //nodeTree.push(<Xarrow key={arrowRef} start={node.parentRef} end={idRef} startAnchor='right' endAnchor='left' />);
        }    
        return (<div className="childstack">{nodeTree}</div>);
    } else {
        return (null);
    }
}

export const RootNode = () => {
    const jsonObject = ReactRedux.useSelector( (state) => (state.jsonObject) );
    
    return (
        <div className="tree_display">
            <SimpleNode id="root" key="Root" label="Root" content="Root node"/>
            <ChildrenNodes key="root children" parentRef="root" object={jsonObject} />
        </div>
    );
}

////////////////////////////////////////////////////// 