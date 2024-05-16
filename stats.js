/**
 * Represents a tree node.
 * @typedef {Object} TreeNode
 * @property {Map<number, TreeNode>} children
 * @property {word[]} words
 * @property {TreeNode | null} parent
 * @property {word} guess
 */

/** @type {TreeNode} The root of the tree. */
var rootNode;
/** @type {TreeNode} The node that is currently on display. */
var displayedNode;
/** @type {string} The current word. */
var _currentWord = "";

