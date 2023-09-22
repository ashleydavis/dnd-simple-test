import './App.css';
import { useEffect, useState, createContext, useContext, useRef } from 'react';

const _DragContext = createContext(null);

export function DragContext({ onDragStart, onDragOver, onDragEnd, onDragCancel, children }) {

    const [active, setActive] = useState(undefined);
    const [over, setOver] = useState(undefined);
    const [mousePos, setMousePos] = useState(undefined); //todo: updates to mouse pos probably should be debounced.
    const [dragStartDelta, setDragStartDelta] = useState(undefined);
    const droppableRefs = useRef({}); 

    useEffect(() => {
        if (!active) {
            return;
        }

        //
        // Handles move movement once dragging has commenced.
        //
        function onMouseMove(event) {
            setMousePos({ x: event.clientX, y: event.clientY });
    
            const nowOver = determineDragOver(event);
            if (nowOver !== undefined) {
                if (nowOver.id !== over?.id) {
                    setOver(nowOver);
                }
            }
            else {
                if (over !== undefined) {
                    setOver(undefined);
                }
            }

            onDragOver({ //todo: this should be debounced.
                active,
                over: nowOver,
                mousePos: { x: event.clientX, y: event.clientY },
            });

            event.stopPropagation();
            event.preventDefault();
        }
        
        //
        // Handles mouse up to conclude dragging.
        //
        function onMouseUp(event) {
            setMousePos({ x: event.clientX, y: event.clientY });

            const over = determineDragOver(event);
            if (over) {
                onDragEnd({
                    active,
                    over,
                    mousePos: { x: event.clientX, y: event.clientY },
                });
            }
            else {
                onDragCancel({
                    active,
                    over,
                    mousePos: { x: event.clientX, y: event.clientY },
                });
            }

            setActive(undefined);
            setOver(undefined);
            event.stopPropagation();
            event.preventDefault();
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        return () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

    }, [active]);

    //
    // Determine which droppable the mouse is over.
    //
    function determineDragOver(mouseEvent) {
        if (droppableRefs.current) {
            for (const droppable of Object.values(droppableRefs.current)) {
                const droppableRect = droppable.el.getBoundingClientRect();

                //TODO: closest corner would be better.
                //todo: When there are nested elements the ones on top need to have priority.
                //todo: could delegate this to the client.
                // If the mouse position is within the droppable area.
                if (mouseEvent.clientX >= droppableRect.left && mouseEvent.clientX <= droppableRect.right &&
                    mouseEvent.clientY >= droppableRect.top && mouseEvent.clientY <= droppableRect.bottom) {
                    return droppable;
                }
            }
        }

        return undefined;
    }

    //
    // Activates dragging of an active item.
    //
    function activateDragging(event, id, el, data) {
        setMousePos({ x: event.clientX, y: event.clientY });
        const elRect = el.getBoundingClientRect();
        setDragStartDelta({ x: event.clientX - elRect.left, y: event.clientY - elRect.top });
        setActive({ id, el, data });
        onDragStart({
            active: { id, el, data },
            mousePos: { x: event.clientX, y: event.clientY },
        });
    }

    //
    // Registers a droppable element with the context.
    //
    function registerDroppable(id, el, data) { //todo: this function is being spammed while dragging and it shoudn't change until the drag is over.
        droppableRefs.current = {
            ...droppableRefs.current,
            [id]: { id, el, data },
        };
    }

    //
    // Unregisters a droppable element from the context.
    //
    function unregisterDroppable(id) {
        delete droppableRefs.current[id];
    }

    const value = {
        active, 
        over,
        activateDragging,
        registerDroppable,
        unregisterDroppable,
        mousePos,
        dragStartDelta,
    };

    return (
        <_DragContext.Provider
            value={value}
            >
            {children}
        </_DragContext.Provider>
    );
}

function useDragContext() {
    return useContext(_DragContext);
}

function useDraggable({ id, data }) {

    const { activateDragging } = useDragContext();
    const nodeRef = useRef(undefined);

    useEffect(() => {
        function onMouseDown(event) {
            //todo: only initiate dragging when moved a certain distance.
            activateDragging(event, id, nodeRef.current, data); //todo: when do we clone the data? Can the id be changed?

            event.stopPropagation();
            event.preventDefault();
        }

        if (nodeRef.current) {
            nodeRef.current.addEventListener('mousedown', onMouseDown);
        }

        return () => {
            if (nodeRef.current) {
                nodeRef.current.removeEventListener('mousedown', onMouseDown);
            }
        };
    }, [id, data]);

    function setNodeRef(el) {
        nodeRef.current = el;
    }

    return {
        setNodeRef,
    };
}

function useDroppable({ id, data }) {

    const { registerDroppable, unregisterDroppable } = useDragContext();
    const nodeRef = useRef(undefined);

    useEffect(() => {
        if (nodeRef.current) {
            registerDroppable(id, nodeRef.current, data);
        }

        return () => {
            if (nodeRef.current) {
                unregisterDroppable(id);
            }
        };
    }, [id, data]);

    function setNodeRef(el) {
        nodeRef.current = el;
    }

    return {
        setNodeRef,
    };
}

function Item({ item, index }) {

    const { setNodeRef: setDraggableRef } = useDraggable({ 
        id: item.id, 
        data: {
            index,
            item,
        },
    });
    const { setNodeRef: setDroppableRef } = useDroppable({ 
        id: item.id, 
        data: {
            index,
            item,
        },
    });

    return (
        <div
            ref={el => {
                setDraggableRef(el);
                setDroppableRef(el);
            }}
            className="m-1 p-1 border-2 border-solid border-gray-600 bg-white w-48 h-24"
            >
            {item.name} ({index})
        </div>
    );
}

function CirclePlusIcon({ color }) {
    return (
        <svg height="24" width="24">
            <circle
                cx="12"
                cy="12"
                r="10"
                style={{ fill: color }}
            />
            <line
                x1="12"
                y1="7"
                x2="12"
                y2="17"
                style={{ stroke: "white", strokeWidth: 2 }}
            />
            <line
                x1="7"
                y1="12"
                x2="17"
                y2="12"
                style={{ stroke: "white", strokeWidth: 2 }}
            />
        </svg>
    );
}

function DragOverlay() {
    const { active, over, mousePos, dragStartDelta } = useDragContext();

    let overRect;
    let insertionPointStyle;
    let xMidPoint;
    let yMidPoint;
    if (over) {
        overRect = over?.el.getBoundingClientRect();

        let height = overRect.bottom - overRect.top;
        let width = overRect.right - overRect.left;
        xMidPoint = overRect.left + width / 2;
        yMidPoint = overRect.top + height / 2;

        //todo: if the list is horizontal then the insertion point should be the other way.

        if (mousePos.y < yMidPoint) {
            // Insertion at top.
            insertionPointStyle = {
                position: 'absolute',
                left: overRect.left,
                width, 
                top: overRect.top - 2,
                height: 4,
                zIndex: 500,
                backgroundColor: 'blue',
            };
        }
        else {
            // Insertion at bottom.
            insertionPointStyle = {
                position: 'absolute',
                left: overRect.left,
                width, 
                top: overRect.bottom,
                height: 4,
                zIndex: 500,
                backgroundColor: 'blue',
            };
        }
    }
    
    return (
        <>
            {active 
                && <div
                    className="m-1 p-1 border-2 border-solid border-gray-600 bg-white w-48 h-24 pointer-events-none"
                    style={{
                        position: 'absolute',
                        left: mousePos?.x - dragStartDelta.x,
                        right: mousePos?.x + 10,
                        top: mousePos?.y - dragStartDelta?.y,
                        bottom: mousePos?.y + 10,
                        zIndex: 1000,
                    }}
                    >
                    {active.data.item.name}
                    {over &&
                        <div>Over {over.data.item.name}</div>
                    }
                </div>
            }

            {over &&
                <div
                    className="pointer-events-none"
                    style={insertionPointStyle}
                    >
                    <div
                        style={{
                            position: 'absolute',
                            left: xMidPoint - 12,
                            width: 24,
                            top: -10,
                            height: 24,
                            zIndex: 1100,
                        }}
                        >
                        <CirclePlusIcon color="blue" />
                    </div>
                </div>
            }
        </>
    );
}

function App() {
    const [items, setItems] = useState([ //todo: some animations would be good to slot the items into place.
        { id: 1, name: 'item 1' },
        { id: 2, name: 'item 2' },
        { id: 3, name: 'item 3' },
    ]);

    return (
        <DragContext
            onDragStart={event => {
                console.log(`Drag started`);
                console.log(event.active);
                console.log(`Source: ${event.active.data.index}`);
            }}
            onDragOver={event => {
                // console.log(`Drag over`); //todo: Don't forget that I need to know which half of the droppable the mouse is over.
                // console.log(event);
            }}
            onDragEnd={event => {
                console.log(`Drag ended`);
                console.log(event);
                const { active, over } = event;
                const overRect = over?.el.getBoundingClientRect();

                const height = overRect.bottom - overRect.top;
                const width = overRect.right - overRect.left;
                const xMidPoint = overRect.left + width / 2;
                const yMidPoint = overRect.top + height / 2;

                //todo: if the list is horizontal then the insertion point should be the other way.

                const sourceIndex = active.data.index;
                let targetIndex = over.data.index;

                if (event.mousePos.y >= yMidPoint) {
                    // If we drag below the midpoint then we need to insert after the item.
                    targetIndex += 1;
                }

                if (sourceIndex === targetIndex) {
                    // The item was dropped in the same position it was dragged from.
                    return;
                }

                setItems(items => {
                    const newItems = [...items];
                    const [ item ] = newItems.splice(sourceIndex, 1); // Remove the item from original position.
                    if (active.data.index < targetIndex) {
                        // The removed item is before the over item, so the index of the moved item is now one less.
                        targetIndex -= 1;
                    }
                    newItems.splice(over.data.index, 0, item); // Insert the item at new position.
                    return newItems;
            });
            }}
            onDragCancel={event => {
                console.log(`Drag cancelled`);
                console.log(event);
            }}
            >
            <div
                className="flex flex-row w-full h-screen relative"
                >
                <div className="flex flex-col flex-grow bg-green-200 h-full">
                    {items.map((item, index) => (
                        <Item 
                            key={item.id} 
                            item={item} 
                            index={index}
                            />
                    ))}
                </div>
                
                <DragOverlay />
            </div>
        </DragContext>
    );
}

export default App;
