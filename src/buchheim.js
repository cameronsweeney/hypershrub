import React from 'react';
import * as ReactRedux from 'react-redux';

// import { IconButton } from '@chakra-ui/react';
// import { EditIcon, AddIcon, CloseIcon } from '@chakra-ui/icons';

let default_ancestor;
let PHI = 1.8;
//let PHI = (1+Math.sqrt(5))/2;


/*
const NodeMenuButtons = () => {
    const dispatch = ReactRedux.useDispatch();

    return (
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
    );
}
*/

const NodeComponent = (props) => {
    const focusedNode = ReactRedux.useSelector( (state) => (state.focusedNode) );

    const isThisNodeFocused = (props.node.nodePath === focusedNode)
    const focusDivStyle = isThisNodeFocused ? {border: 'thick var(--color-node-focus) solid'} : ({});
    const focusH1Style = isThisNodeFocused ? {backgroundColor: 'var(--color-node-focus)'} : ({});

    let xSpan = props.max - props.min;
    let xPercent = 100 * (props.node.x - props.min) / xSpan;
    let yPercent = (props.node.y) ? 30 + 15 * props.node.y : 0;
    if (!(props.node.y - 1)) { // only false for first level of visible children, display others linearly
        const xPercentAsAngle = (50 - xPercent) / 100 * Math.PI;
        xPercent = 50 - (PHI * 25 * Math.sin(xPercentAsAngle));
        yPercent = 20 * Math.cos(xPercentAsAngle);
    } else if (props.node.nodePath !== '.') {
        xPercent *= 0.95;
    }



    return (
        <div className="node" style={{...focusDivStyle, left: `${yPercent}%`, top: `${xPercent}%`}}>
            <div>
                <h1 key={props.node.nodePath + '.label'} style={focusH1Style}>{props.node.key}</h1>
                {/* <p><span>{props.node.dataType}</span></p> */}
            </div>
            <p key={props.node.nodePath + '.content'}>{(props.node.value && typeof props.node.value !== 'object') ? `${props.node.value}` : ''}</p>
        </div>
    );
};

function moveSubtrees(leftSubtree, rightSubtree, shift) {
    const countOfSubtreesBetween = rightSubtree.siblingNumber - leftSubtree.siblingNumber;
    leftSubtree.change_mod += shift / countOfSubtreesBetween;
    rightSubtree.change_mod -= shift / countOfSubtreesBetween;
    rightSubtree.shift_mod += shift;
    rightSubtree.x += shift;
    rightSubtree.mod += shift;
}

class BuchheimTree {
    constructor(key, value, depth=0, siblingNumber=0, parent=null) {
    // this is the first walk in Buchheim's algorithm
    // https://link.springer.com/content/pdf/10.1007/3-540-36151-0_32.pdf
    // https://llimllib.github.io/pymag-trees/
    // https://rachel53461.wordpress.com/2014/04/20/algorithm-for-drawing-trees/
        this.x = 0;
        this.y = depth;
        this.mod = 0;
        this.shift_mod = 0;
        this.change_mod = 0;

        this.key = key;
        this.value = value;
        this.siblingNumber = siblingNumber;
        if (parent) {
            this.parent = parent;
            this.nodePath = `${parent.nodePath}/${key}`;
        } else {
            this.nodePath = '.';
        }
        this.parent = parent;
        this.thread = null;
        this.ancestor = this;

        this.childrenNodes = [];
        if (value && typeof value == 'object') { // has children?
            this.dataType = Array.isArray(value) ? 'array' : 'object';
            let childIndex = 0;

            // first traversal is of JavaScript object
            for (let child_key_value of Object.entries(value)) {
                let child_key = child_key_value[0];
                let child_value = child_key_value[1];
                //console.log(`    childnode: ${child_key}>${child_value}`);
                let newborn = new BuchheimTree(child_key, child_value, depth+1, childIndex, this)
                this.childrenNodes.push(newborn);
                if (!childIndex) { default_ancestor = this.childrenNodes[0]; } // set default ancestor to first sibling
                default_ancestor = this.childrenNodes.at(-1).rightMerge(default_ancestor);
                childIndex += 1;
            }
            // apply shifts for all of current node's children, once the last one has been placed
            let shift = 0;
            let change = 0;
            for (let childNode of this.childrenNodes.slice().reverse()) {
                childNode.x += shift;
                childNode.mod += shift;
                change += childNode.change_mod;
                shift += childNode.shift_mod + change;
            }

            let midpoint = (this.getFirstChild().x + this.getLastChild().x) / 2;
            if (this.getPrevSibling()) {
                this.x = this.getPrevSibling().x + 1;
                this.mod = this.x - midpoint;
            } else {
                this.x = midpoint;
            }
        } else {
            if (this.getPrevSibling()) {
                this.x += this.getPrevSibling().x + 1;
            }
            this.dataType = typeof value;
        }
    }

    getNextSibling() {
        return this?.parent?.childrenNodes?.[this.siblingNumber+1];
    }

    getPrevSibling() {
        if (this.siblingNumber) { // will be 0 & thus falsy if called on the first sibling
            return this?.parent.childrenNodes[this.siblingNumber-1];
        } else {
            return undefined;
        }
    }

    getFirstSibling() {
        return this?.parent.childrenNodes[0];
    }

    getFirstChild() {
        if (this.thread) { return this.thread; }
        else {
            return this?.childrenNodes[0];
        }
    }

    getLastChild() {
        if (this.thread) { return this.thread; }
        else {
            return this?.childrenNodes.at(-1);
        }
    }

    rightMerge(default_ancestor) {
        if (!this.getPrevSibling()) { return default_ancestor; }
    
        let outerLeftContour = this.getFirstSibling();
        let innerLeftContour = this.getPrevSibling();
        let innerRightContour = this;
        let outerRightContour = this;
    
        let outerLeftShift = outerLeftContour.mod;
        let innerLeftShift = innerLeftContour.mod;
        let innerRightShift = this.mod;
        let outerRightShift = this.mod;
    
        while (innerLeftContour.getLastChild() && innerRightContour.getFirstChild()) {
            // traverse down tree
            outerLeftContour = outerLeftContour.getFirstChild();
            innerLeftContour = innerLeftContour.getLastChild();
            innerRightContour = innerRightContour.getFirstChild();
            outerRightContour = outerRightContour.getLastChild();
            outerRightContour.ancestor = this;
    
            // shift tree if there's a conflict at this level
            let distance = (innerLeftContour.x + innerLeftShift) - (innerRightContour.x + innerRightShift) + 1; // plus one to give minimum 1 unit padding between trees
            if (distance > 0) {
                //console.log(`    conflict found! ${innerLeftContour.nodePath} and ${innerRightContour.nodePath}`)
                if (this.parent.childrenNodes.includes(innerLeftContour.ancestor) ) {
                    //console.log(`        using inner left contour's ancestor ${innerLeftContour.ancestor}`)
                    moveSubtrees(innerLeftContour.ancestor, this, distance);
                } else {
                    //console.log(`        using default_ancestor ${default_ancestor}`)
                    moveSubtrees(default_ancestor, this, distance);
                }
                innerRightShift += distance;
                outerRightShift += distance;
            }
    
            // update shifts
            outerLeftShift += outerLeftContour.mod;
            innerLeftShift += innerLeftContour.mod;
            innerRightShift += innerRightContour.mod;
            outerRightShift += outerRightContour.mod;
        }
        // check for thread on left
        if (innerRightContour.getFirstChild() && !outerLeftContour.getFirstChild()) {
            outerLeftContour.thread = innerRightContour.getFirstChild();
            outerLeftContour.mod += innerRightShift - outerLeftShift;
        }
        // check for thread on right
        if (innerLeftContour.getLastChild() && !outerRightContour.getLastChild()) {
            outerRightContour.thread = innerLeftContour.getLastChild();
            outerRightContour.mod += innerLeftShift - outerRightShift;
        } else {
            default_ancestor = this;
        }
        return default_ancestor;
    }

    secondWalk(running_mod=0, global_min=0, global_max=0, depth=0) {
        this.x += running_mod;

        if (this.x > global_max) {
            global_max = this.x;
        } else if (this.x < global_min) {
            global_min = this.x;
        }

        for (let childNode of this.childrenNodes) {
            [global_min, global_max, depth] = childNode.secondWalk(running_mod+this.mod, global_min, global_max, depth+1);
        }
        return [global_min, global_max, depth];
    }

    componentWalk(min, max, depth, treeNodeComponents) {
        let myNodeComponent = <NodeComponent key={this.nodePath} node={this} min={min} max={max} depth={depth}/>;
        treeNodeComponents.push(myNodeComponent);
        if (this.childrenNodes.length) {
            for (let childNode of this.childrenNodes) {
                childNode.componentWalk(min, max, depth, treeNodeComponents);
            }
        }
        return treeNodeComponents;
    }

}


/*
let myObject = {
    name: 'Kadabra',
    natdex: 64,
    type1: 'Psychic',
    stats: {
        hp: 40,
        attack: 35,
        defense: 30,
        special: 120,
        speed: 105
    },
    base_exp: 145,
    catch_rate: 100,
    growth_rate: 'Medium Slow',
    learnbase: ['Teleport', 'Confusion', 'Disable']
}
*/




export let TreeDisplay = () => {
    const jsonObject = ReactRedux.useSelector( (state) => (state.jsonObject) );
    const dispatch = ReactRedux.useDispatch();

    let myTree = new BuchheimTree('root', jsonObject);
    let [min, max, depth] = myTree.secondWalk();
    let treeNodeComponents = myTree.componentWalk(min, max, depth, []);

    React.useEffect( () => {
        dispatch({type: 'focus_node', payload: myTree});

        function keyPressListener (event) {
            if (event.Handled) { return; }
            switch (event.code) {
                case 'ArrowUp':
                    dispatch({type: 'focus_prev_sibling'});
                    break;
                case 'ArrowDown':
                    dispatch({type: 'focus_next_sibling'});
                    break;
                case 'ArrowLeft':
                    dispatch({type: 'focus_parent'});
                    break;
                case 'ArrowRight':
                    dispatch({type: 'focus_child'});
                    break;
            }
            event.Handled = true;
        }

        document.addEventListener('keyup', keyPressListener);

    });

    return (
        <div className='forest_padding'><div className='tree_display'>{treeNodeComponents}</div></div>
    );
}

/*
console.log(myObject);


let myTree = new objectTree('root', myObject);
console.log(myTree);
let finishedTree = secondTraversal(myTree);
console.log(finishedTree); */