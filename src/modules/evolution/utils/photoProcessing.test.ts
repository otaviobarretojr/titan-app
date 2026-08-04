import { describe, expect, it } from 'vitest'
import { MAX_PHOTO_INPUT_BYTES, optimizeProgressPhoto } from './photoProcessing'
describe('photo optimization',()=>{
 it('rejects unsupported formats and oversize photos',async()=>{await expect(optimizeProgressPhoto(new File(['x'],'x.gif',{type:'image/gif'}))).rejects.toThrow('JPEG');const huge={type:'image/jpeg',size:MAX_PHOTO_INPUT_BYTES+1} as File;await expect(optimizeProgressPhoto(huge)).rejects.toThrow('12 MB')})
})
