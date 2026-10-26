import { MyPromise } from './promise';

const promise = new MyPromise((resolve, reject) => {
    // executor logic here
    throw new Error('An error occurred');
});
console.log(promise);
