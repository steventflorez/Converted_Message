


import indigitall from '@api/indigitall';





class IndigitalService {

  static indigitall = indigitall;

  params = {
    dateFrom: '2024-01-01',
    dateTo: '2024-12-31',
    applicationId: 14 // Asegúrate de asignar un valor válido
  };


  useIndigital(){
    indigitall.getMessageHistoryCsvByDate(this.params)
  .then(({ data }) => console.log(data))
  .catch(err => console.error(err));
  }

}
