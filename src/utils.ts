type strbyte = string;

/**
 * Converts a binary number string into a regular number string
 * @param n binary string to be converted to number
 * @returns 
 */
function bton(n: strbyte): number {
    return parseInt(n, 2);
}

/**
 * Converts a binary number string into a hexadecimal number string
 * @param n binary string to be converted to hex
 * @returns 
 */
function btoh(n: strbyte): strbyte {
    return parseInt(n, 2).toString(16);
}

/**
 * Converts a number to binary (+ Pads start with 0's if the number uses less than 8 bits to be represented)
 * @param n number to be converted to binary
 * @returns 
 */
function ntob(n: number): strbyte {
    return n.toString(2).padStart(8, '0');
}

export { bton, btoh, ntob };