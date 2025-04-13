// FlyToCart.js
import { motion, AnimatePresence } from "framer-motion";
import React from "react";

const FlyToCart = ({ image, startPosition, endPosition, onComplete }) => {
    if (!startPosition || !endPosition) return null;

    const distanceX = endPosition.x - startPosition.x;
    const distanceY = endPosition.y - startPosition.y;

    return (
        <AnimatePresence>
            <motion.img
                src={image}
                initial={{ x: startPosition.x, y: startPosition.y, scale: 1, opacity: 1, position: "absolute", width: 100, height: 100, borderRadius: 10 }}
                animate={{ x: distanceX, y: distanceY, scale: 0.3, opacity: 0.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                onAnimationComplete={onComplete}
                style={{ zIndex: 9999, pointerEvents: "none" }}
            />
        </AnimatePresence>
    );
};

export default FlyToCart;
