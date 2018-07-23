function isNullOrEmptyTwo(val)
{
    if( val == undefined || val == null || $.trim(val).length <= 0){
        return true;
    }else{
        return false;
    }
}