import './App.css';
import { useEffect, useState, createContext, useContext, useRef } from 'react';

const _DragContext = createContext(null);

export function DragContext({ onDragStart, onDragOver, onDragEnd, onDragCancel, children }) {

    const [draggingItem, setDraggingItem] = useState(undefined);
    const [mousePos, setMousePos] = useState(undefined);
    const droppableRefs = useRef({}); 
    const dragOverRef = useRef(undefined);

    useEffect(() => {
        if (!draggingItem) {
            return;
        }

        function onMouseMove(event) {
            setMousePos({ x: event.clientX, y: event.clientY });
    
            if (draggingItem) {
                const droppable = determineDragOver(event);
                if (droppable) {
                    if (droppable.id !== dragOverRef.current?.id) {
                        dragOverRef.current = droppable;
                        onDragOver({
                            active: draggingItem,
                            over: droppable,
                        });
                    }
                }
            }

            event.stopPropagation();
            event.preventDefault();
        }
        
        function onMouseUp(event) {
            setMousePos({ x: event.clientX, y: event.clientY });

            const draggedItem = draggingItem;
            const droppable = determineDragOver(event);

            setDraggingItem(undefined);
            dragOverRef.current = undefined;

            if (droppable) {
                onDragEnd({
                    active: draggedItem,
                    over: droppable,
                });
            }
            else {
                onDragCancel({
                    active: draggedItem,
                });
            }

            event.stopPropagation();
            event.preventDefault();
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        return () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

    }, [draggingItem]);

    //
    // Determine which droppable the mouse is over.
    //
    function determineDragOver(mouseEvent) {
        if (droppableRefs.current) {
            for (const [id, droppable] of Object.entries(droppableRefs.current)) {
                const droppableRect = droppable.el.getBoundingClientRect();

                //TODO: closest corner would be better.
                // If the mouse position is within the droppable area.
                if (mouseEvent.clientX >= droppableRect.left && mouseEvent.clientX <= droppableRect.right &&
                    mouseEvent.clientY >= droppableRect.top && mouseEvent.clientY <= droppableRect.bottom) {
                    return { id, el: droppable.el, data: droppable.data };
                }
            }
        }

        return undefined;
    }

    function initiateDragging(event, id, el, data) {
        setMousePos({ x: event.clientX, y: event.clientY });
        setDraggingItem({ id, el, data });
        onDragStart({
            data,
        });
    }

    function registerDroppable(id, el, data) {
        droppableRefs.current = {
            ...droppableRefs.current,
            [id]: { el, data },
        };
    }

    function unregisterDroppable(id) {
        delete droppableRefs.current[id];
    }

    const value = {
        draggingItem, 
        initiateDragging,
        registerDroppable,
        unregisterDroppable,
        mousePos,
        setMousePos,
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

    const { initiateDragging } = useDragContext();
    const nodeRef = useRef(undefined);

    useEffect(() => {
        function onMouseDown(event) {
            //tdoo: only initiate dragging when moved a certain distance.
            initiateDragging(event, id, nodeRef.current, data); //todo: when do we clone the data?

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
    }, []);

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
    }, []);

    function setNodeRef(el) {
        nodeRef.current = el;
    }

    return {
        setNodeRef,
    };
}

function Item({ item }) {

    const { setNodeRef: setDraggableRef } = useDraggable({ id: item.id, data: item });
    const { setNodeRef: setDroppableRef } = useDroppable({ id: item.id, data: item });

    return (
        <div
            ref={el => {
                setDraggableRef(el);
                setDroppableRef(el);
            }}
            className="m-1 p-1 border-2 border-solid border-gray-600 bg-white w-48 h-48"
            >
            {item.name}
        </div>
    );
}

function DragOverlay() {
    const { draggingItem, mousePos } = useDragContext();

    return draggingItem 
        && <div
            className="m-1 p-1 border-2 border-solid border-gray-600 bg-white w-48 h-48"
            style={{
                position: 'absolute',
                top: mousePos?.y,
                left: mousePos?.x,
                right: mousePos?.x + 10,
                bottom: mousePos?.y + 10,
            }}
            >
            {draggingItem.name}
        </div>
        || undefined;
}

function App() {
    const [items1, setItems1] = useState([
        { id: 1, name: 'item 1' },
    ]);
    const [items2, setItems2] = useState([
        { id: 2, name: 'item 2' },
    ]);
    
    return (
        <DragContext
            onDragStart={event => {
                console.log(`Drag started`);
                console.log(event);
            }}
            onDragOver={event => {
                console.log(`Drag over`);
                console.log(event);
            }}
            onDragEnd={event => {
                console.log(`Drag ended`);
                console.log(event);
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
                    {items1.map(item => (
                        <Item key={item.id} item={item} />
                    ))}
                </div>

                <div className="flex flex-col flex-grow bg-blue-200 h-full">
                    {items2.map(item => (
                        <Item key={item.id} item={item} />
                    ))}
                </div>

                <DragOverlay />
            </div>
        </DragContext>
    );
}

export default App;
